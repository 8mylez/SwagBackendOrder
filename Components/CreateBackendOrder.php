<?php

class Shopware_Components_CreateBackendOrder extends Enlight_Class
{
    /**
     * sets the default desktop type if no desktop type was chosen
     */
    const DEFAULT_DESKTOP_TYPE = 'Backend';

    private $orderId;

    public function createOrder($data, $ordernumber)
    {
        $positions = $data['position'];

        /**
         * creates an empty row
         * -> workaround for the partner model (you must pass one, but not every order has a partner)
         */
        $sql = 'INSERT INTO s_order (ordernumber)
                        VALUES (?)';

        Shopware()->Db()->query($sql, array($ordernumber));

        $sql = 'SELECT id FROM s_order WHERE ordernumber = ?';
        $this->orderId = Shopware()->Db()->fetchOne($sql, array($ordernumber));

        /** @var Shopware\Models\Order\Order $orderModel */
        $orderModel = Shopware()->Models()->find('Shopware\Models\Order\Order', $this->orderId);

        /** @var Shopware\Models\Customer\Customer $customerModel */
        $customerModel = Shopware()->Models()->find('Shopware\Models\Customer\Customer', $data['customerId']);
        $orderModel->setCustomer($customerModel);

        /** @var Shopware\Models\Dispatch\Dispatch $dispatchModel */
        $dispatchModel = Shopware()->Models()->find('Shopware\Models\Dispatch\Dispatch', $data['dispatchId']);
        $orderModel->setDispatch($dispatchModel);


        /** @var Shopware\Models\Payment\Payment $paymentModel */
        $paymentModel = Shopware()->Models()->find('Shopware\Models\Payment\Payment', $data['paymentId']);
        $orderModel->setPayment($paymentModel);

        /**
         * 0 = order status open
         * @var Shopware\Models\Order\Status $orderStatusModel
         */
        $orderStatusModel = Shopware()->Models()->find('Shopware\Models\Order\Status', 0);
        $orderModel->setOrderStatus($orderStatusModel);

        /**
         * 17 = payment status open
         * @var Shopware\Models\Order\Status $paymentStatusModel
         */
        $paymentStatusModel = Shopware()->Models()->find('Shopware\Models\Order\Status', 17);
        $orderModel->setPaymentStatus($paymentStatusModel);

        /**
         * @var Shopware\Models\Shop\Shop $languageSubShopModel
         */
        $languageSubShopModel = Shopware()->Models()->find('Shopware\Models\Shop\Shop', $data['languageShopId']);
        $orderModel->setLanguageSubShop($languageSubShopModel);

        $orderModel->setInvoiceShippingNet($data['shippingCostsNet']);
        $orderModel->setInvoiceShipping($data['shippingCosts']);

        $orderModel->setInvoiceAmount($data['total']);
        $orderModel->setInvoiceAmountNet($data['totalWithoutTax']);

        $orderModel->setShop($customerModel->getShop());

        $orderModel->setNumber($ordernumber);

        $orderModel->setOrderTime(new DateTime('now'));

        $data['desktopType'] = self::DEFAULT_DESKTOP_TYPE;
        if ($data['desktopType'] !== '' && $data['desktopType'] !== null && isset($data['desktopType'])) {
            $orderModel->setDeviceType($data['desktopType']);
        }

        $orderModel->setTransactionId('');
        $orderModel->setComment('');
        $orderModel->setCustomerComment('');
        $orderModel->setInternalComment('');
        $orderModel->setNet($data['net']);
        $orderModel->setTemporaryId('');
        $orderModel->setReferer('');
        $orderModel->setTrackingCode('');
        $orderModel->setRemoteAddress('');

        /** @var Shopware\Models\Shop\Currency $currencyModel */
        $currencyModel = Shopware()->Models()->find('Shopware\Models\Shop\Currency', $data['currencyId']);
        $orderModel->setCurrencyFactor($currencyModel->getFactor());
        $orderModel->setCurrency($currencyModel->getCurrency());

        /** @var Shopware\Models\Order\Detail[] $details */
        $details = array();

        //checks if more than one position was passed
        if ( $this->isAssoc($positions)) {
            $details[] = $this->createOrderDetail($positions, $orderModel);

            if ( !end($details)) {
                $this->deleteOrder();
                return false;
            }
        } else {
            foreach ($positions as $position) {
                $details[] = $this->createOrderDetail($position, $orderModel);

                if ( !end($details)) {
                    $this->deleteOrder();
                    return false;
                }
            }
        }
        $orderModel->setDetails($details);

        /** @var Shopware\Models\Attribute\Order[] $orderAttributes */
        $orderAttributes = $this->setOrderAttributes($data['orderAttribute'][0]);
        $orderModel->setAttribute($orderAttributes);

        /** @var Shopware\Models\Order\Billing $billingModel */
        $billingModel = $this->createBillingAddress($data);
        $orderModel->setBilling($billingModel);

        /** @var Shopware\Models\Order\Shipping $shippingModel */
        $shippingModel = $this->createShippingAddress($data);
        $orderModel->setShipping($shippingModel);

        /** @var Shopware\Models\Payment\PaymentInstance $paymentInstance */
        $paymentInstance = $this->preparePaymentInstance($orderModel);
        $orderModel->setPaymentInstances($paymentInstance);

        Shopware()->Models()->persist($paymentInstance);
        Shopware()->Models()->persist($orderModel);
        Shopware()->Models()->flush();

        /*
         * I don't know why but the amountNet changes to the amount after the first flushing but it was written correct to the db
         * this is only for using the model without problems
         */
        $orderModel->setInvoiceAmountNet($data['totalWithoutTax']);
        Shopware()->Models()->persist($orderModel);
        Shopware()->Models()->flush();

        if ( is_null($billingModel->getState()))  {
            Shopware()->Db()->update('s_order_billingaddress', array('stateID' => 0), array('id' => $billingModel->getId()));
        }
        if ( is_null($shippingModel->getState())) {
            Shopware()->Db()->update(
                    's_order_shippingaddress',
                    array('stateID' => 0),
                    array('id' => $shippingModel->getId())
            );
        }

        return $orderModel;
    }

    /**
     * @param array $position
     * @param Shopware\Models\Order\Order $orderModel
     * @return array
     */
    private function createOrderDetail($position, $orderModel)
    {
        $orderDetailModel = new Shopware\Models\Order\Detail();

        $articleIds = Shopware()->Db()->fetchRow("SELECT a.id, ad.id AS detailId
                                                  FROM s_articles a, s_articles_details ad
                                                  WHERE a.id = ad.articleID
                                                  AND ad.ordernumber = ?",
                array($position['articleNumber']));

        //checks if the article exists
        if ( empty($articleIds)) {
            $this->view->assign(array(
                            'success' => false,
                            'data' => array('articleNumber' => $position['articleNumber'])
                    ));

            return false;
        }

        $articleId = $articleIds['id'];
        $articleDetailId = $articleIds['detailId'];

        /** @var Shopware\Models\Article\Article $articleModel */
        $articleModel = Shopware()->Models()->find('Shopware\Models\Article\Article', $articleId);

        /** @var Shopware\Models\Article\Detail $articleDetailModel */
        $articleDetailModel = Shopware()->Models()->find('Shopware\Models\Article\Detail', $articleDetailId);

        if ( is_object($articleDetailModel->getUnit())) {
            $unitName = $articleDetailModel->getUnit()->getName();
        } else {
            $unitName = 0;
        }

        /** @var Shopware\Models\Tax\Tax $taxModel */
        $taxModel = Shopware()->Models()->find('Shopware\Models\Tax\Tax', $position['taxId']);
        $orderDetailModel->setTax($taxModel);
        $orderDetailModel->setTaxRate($position['taxRate']);

        /** checks if it is an esdArticle */
        $orderDetailModel->setEsdArticle(0);

        /** @var Shopware\Models\Order\DetailStatus $detailStatusModel */
        $detailStatusModel = Shopware()->Models()->find('Shopware\Models\Order\DetailStatus', 0);
        $orderDetailModel->setStatus($detailStatusModel);

        $orderDetailModel->setArticleId($articleModel->getId());
        $orderDetailModel->setArticleName($articleModel->getName());
        $orderDetailModel->setArticleNumber($articleModel->getMainDetail()->getNumber());
        $orderDetailModel->setPrice($position['price']);
        $orderDetailModel->setMode(4);
        $orderDetailModel->setQuantity($position['quantity']);
        $orderDetailModel->setShipped(0);
        $orderDetailModel->setUnit($unitName);
        $orderDetailModel->setPackUnit($articleDetailModel->getPackUnit());

        $orderDetailModel->setNumber($orderModel->getNumber());
        $orderDetailModel->setOrder($orderModel);

        return $orderDetailModel;
    }

    /**
     * sets the order attributes
     *
     * @param $attributes
     * @return \Shopware\Models\Attribute\Order
     */
    private function setOrderAttributes($attributes)
    {
        $orderAttributeModel = new \Shopware\Models\Attribute\Order();
        $orderAttributeModel->setAttribute1($attributes['attribute1']);
        $orderAttributeModel->setAttribute2($attributes['attribute2']);
        $orderAttributeModel->setAttribute3($attributes['attribute3']);
        $orderAttributeModel->setAttribute4($attributes['attribute4']);
        $orderAttributeModel->setAttribute5($attributes['attribute5']);
        $orderAttributeModel->setAttribute6($attributes['attribute6']);

        return $orderAttributeModel;
    }

    /**
     * creates the billing address which belongs to the order and
     * saves it as the new last used address
     *
     * @param array $data
     * @return \Shopware\Models\Order\Billing
     */
    private function createBillingAddress($data)
    {
        /** @var Shopware\Models\Customer\Billing $billingCustomerModel */
        $billingCustomerModel = Shopware()->Models()->find('Shopware\Models\Customer\Billing', $data['billingAddressId']);

        $billingOrderModel = new Shopware\Models\Order\Billing();
        $billingOrderModel->setCity($billingCustomerModel->getCity());
        $billingOrderModel->setStreet($billingCustomerModel->getStreet());
        $billingOrderModel->setSalutation($billingCustomerModel->getSalutation());
        $billingOrderModel->setZipCode($billingCustomerModel->getZipCode());
        $billingOrderModel->setFirstName($billingCustomerModel->getFirstName());
        $billingOrderModel->setLastName($billingCustomerModel->getLastName());
        $billingOrderModel->setAdditionalAddressLine1($billingCustomerModel->getAdditionalAddressLine1());
        $billingOrderModel->setAdditionalAddressLine2($billingCustomerModel->getAdditionalAddressLine2());
        $billingOrderModel->setVatId($billingCustomerModel->getVatId());
        $billingOrderModel->setPhone($billingCustomerModel->getPhone());
        $billingOrderModel->setFax($billingCustomerModel->getFax());
        $billingOrderModel->setCompany($billingCustomerModel->getCompany());
        $billingOrderModel->setDepartment($billingCustomerModel->getDepartment());
        $billingOrderModel->setNumber($billingCustomerModel->getNumber());
        $billingOrderModel->setCustomer($billingCustomerModel->getCustomer());

        if ($billingCustomerModel->getCountryId()) {
            /** @var Shopware\Models\Country\Country $countryModel */
            $countryModel = Shopware()->Models()->find('Shopware\Models\Country\Country', $billingCustomerModel->getCountryId());
            $billingOrderModel->setCountry($countryModel);
        }

        if ($billingCustomerModel->getStateId()) {
            /** @var Shopware\Models\Country\State $stateModel */
            $stateModel = Shopware()->Models()->find('Shopware\Models\Country\State', $billingCustomerModel->getStateId());
            $billingOrderModel->setState($stateModel);
        }

        return $billingOrderModel;
    }

    /**
     * creates the shipping address which belongs to the order and
     * saves it as the new last used address
     *
     * @param array $data
     * @return \Shopware\Models\Order\Shipping
     */
    private function createShippingAddress($data)
    {
        if ($data['shippingAddressId']) {
            /** @var Shopware\Models\Customer\Shipping $addressHolderModel */
            $addressHolderModel = Shopware()->Models()->find('Shopware\Models\Customer\Shipping', $data['shippingAddressId']);
        } else {
            /** @var Shopware\Models\Customer\Billing $shippingAddressHolder */
            $addressHolderModel = Shopware()->Models()->find('Shopware\Models\Customer\Billing', $data['billingAddressId']);
            $this->equalBillingAddress = true;
        }

        $shippingOrderModel = new Shopware\Models\Order\Shipping();
        $shippingOrderModel->setCity($addressHolderModel->getCity());
        $shippingOrderModel->setStreet($addressHolderModel->getStreet());
        $shippingOrderModel->setSalutation($addressHolderModel->getSalutation());
        $shippingOrderModel->setZipCode($addressHolderModel->getZipCode());
        $shippingOrderModel->setFirstName($addressHolderModel->getFirstName());
        $shippingOrderModel->setLastName($addressHolderModel->getLastName());
        $shippingOrderModel->setAdditionalAddressLine1($addressHolderModel->getAdditionalAddressLine1());
        $shippingOrderModel->setAdditionalAddressLine2($addressHolderModel->getAdditionalAddressLine2());
        $shippingOrderModel->setCompany($addressHolderModel->getCompany());
        $shippingOrderModel->setDepartment($addressHolderModel->getDepartment());
        $shippingOrderModel->setCustomer($addressHolderModel->getCustomer());

        if ($addressHolderModel->getCountryId()) {
            /** @var Shopware\Models\Country\Country $countryModel */
            $countryModel = Shopware()->Models()->find('Shopware\Models\Country\Country', $addressHolderModel->getCountryId());
            $shippingOrderModel->setCountry($countryModel);
        }

        if ($addressHolderModel->getStateId()) {
            /** @var Shopware\Models\Country\State $stateModel */
            $stateModel = Shopware()->Models()->find('Shopware\Models\Country\State', $addressHolderModel->getStateId());
            $shippingOrderModel->setState($stateModel);
        }

        return $shippingOrderModel;
    }

    /**
     * @param Shopware\Models\Order\Order $orderModel
     * @return string
     */
    private function preparePaymentInstance($orderModel)
    {
        $paymentId = $orderModel->getPayment()->getId();
        $customerId = $orderModel->getCustomer()->getId();

        $paymentInstanceModel = new Shopware\Models\Payment\PaymentInstance();

        /** @var Shopware\Models\Customer\PaymentData[] $paymentDataModel */
        $paymentDataModel = $this->getCustomerPaymentData($customerId, $paymentId);

        if ($paymentDataModel[0] instanceof Shopware\Models\Customer\PaymentData) {
            /** @var Shopware\Models\Customer\PaymentData $paymentDataModel */
            $paymentDataModel = $paymentDataModel[0];

            $paymentInstanceModel->setBankName($paymentDataModel->getBankName());
            $paymentInstanceModel->setBankCode($paymentDataModel->getBankCode());
            $paymentInstanceModel->setAccountHolder($paymentDataModel->getAccountHolder());

            $paymentInstanceModel->setIban($paymentDataModel->getIban());
            $paymentInstanceModel->setBic($paymentDataModel->getBic());

            $paymentInstanceModel->setBankCode($paymentDataModel->getBankCode());
            $paymentInstanceModel->setAccountNumber($paymentDataModel->getAccountHolder());
        }

        $paymentInstanceModel->setPaymentMean($orderModel->getPayment());

        $paymentInstanceModel->setOrder($orderModel);
        $paymentInstanceModel->setCreatedAt($orderModel->getOrderTime());

        $paymentInstanceModel->setCustomer($orderModel->getCustomer());
        $paymentInstanceModel->setFirstName($orderModel->getBilling()->getFirstName());
        $paymentInstanceModel->setLastName($orderModel->getBilling()->getLastName());
        $paymentInstanceModel->setAddress($orderModel->getBilling()->getStreet());
        $paymentInstanceModel->setZipCode($orderModel->getBilling()->getZipCode());
        $paymentInstanceModel->setCity($orderModel->getBilling()->getCity());
        $paymentInstanceModel->setAmount($orderModel->getInvoiceAmount());

        return $paymentInstanceModel;
    }

    /**
     * selects the payment data by user and payment id
     *
     * @param $customerId
     * @param $paymentId
     * @return Shopware\Models\Customer\PaymentData
     */
    private function getCustomerPaymentData($customerId, $paymentId) {

        $PaymentDataRepository = Shopware()->Models()->getRepository('Shopware\Models\Customer\PaymentData');
        $paymentModel          = $PaymentDataRepository->findBy(array('paymentMeanId' => $paymentId, 'customer' => $customerId));

        return $paymentModel;
    }

    /**
     * helper function which checks if it is an associative array,
     * to distinguish between an order with one or an order with more than
     * one position
     *
     * @param $array
     * @return bool
     */
    private function isAssoc($array)
    {
        return array_keys($array) !== range(0, count($array) -1);
    }
}