//
//{block name="backend/create_backend_order/view/total_costs_overview"}
//{namespace name="backend/swag_backend_order/view/costs_overview"}
Ext.define('Shopware.apps.SwagBackendOrder.view.main.TotalCostsOverview', {

    extend: 'Ext.container.Container',

    alias: 'widget.createbackendorder-totalcostsoverview',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    name: 'totalCostsContainer',

    style: {
        float: 'left'
    },

    id: 'totalCostsContainer',

    flex: 1.2,

    autoScroll: true,

    padding: '5 10 0 10',

    snippets: {
        sum: '{s name="swag_backend_order/costs_overview/sum"}{/s}',
        shippingCosts: '{s name="swag_backend_order/costs_overview/shipping_costs"}{/s}',
        total: '{s name="swag_backend_order/costs_overview/total"}{/s}',
        totalWithoutTax: '{s name="swag_backend_order/costs_overview/total_without_tax"}{/s}',
        taxSum: '{s name="swag_backend_order/costs_overview/tax_sum"}{/s}',
        totalTaxPrefix: '{s name="cart_footer_total_tax_prefix"}{/s}',
        totalTaxSuffix: '{s name="cart_footer_total_tax_suffix"}{/s}',
        instock: '{s name="swag_backend_order/costs_overview/instock"}{/s}',
        preOrders: '{s name="swag_backend_order/costs_overview/pre_orders"}{/s}',
        price: '{s name="swag_backend_order/costs_overview/price"}{/s}',
        quantity: '{s name="swag_backend_order/costs_overview/quantity"}{/s}',
        ordernumber: '{s name="swag_backend_order/costs_overview/ordernumber"}{/s}',
        lastOrders: '{s name="swag_backend_order/costs_overview/last_orders"}{/s}'
    },

    /**
     * horizontal container to add the costs labels under the grid
     *
     * @returns { Ext.container.Container }
     */

    initComponent: function() {
        var me = this;

        me.getPluginConfig();

        me.currencyStore = me.subApplication.getStore('Currency');
        me.items = [
            me.createTotalCostsOverviewContainer()
        ];

        me.updateTotalCostsEvents();
        me.updateArticleInfoEvents();

        me.displayNetCheckbox.on('change', function(checkbox, newValue, oldValue) {
            me.taxFreeCheckbox.setDisabled(!!newValue);
            me.fireEvent('changeDisplayNet', newValue, oldValue);
        });

        me.sendMailCheckbox.on('change', function(checkbox, newValue, oldValue) {
            me.fireEvent('changeSendMail', newValue, oldValue);
        });

        me.taxFreeCheckbox.on('change', function(checkbox, newValue, oldValue) {
            me.displayNetCheckbox.setDisabled(newValue);
            me.fireEvent('changeTaxFreeCheckbox', newValue, oldValue);
        });

        me.callParent(arguments);

        //Firefox bugfix for get the correct currency symbol
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
            me.updateCurrency();
        }
    },

    /**
     * container with a vbox layout the get the labels in a vertical row
     *
     * @returns { Ext.container.Container }
     */
    createTotalCostsOverviewContainer: function() {
        var me = this;

        me.createTotalCostsStore();
        me.createArticleInfoStore();
        
        me.createOverviewPriceStore();

        me.totalCostsLabelsView = me.createTotalCostsLabelsView();
        me.articleInfoView = me.createArticleInfoView();
        me.overviewPriceView = me.createOverviewPriceView();

        me.lastOrderView1 = me.createLastOrderView(1);
        me.lastOrderView2 = me.createLastOrderView(2);
        me.lastOrderView3 = me.createLastOrderView(3);
        
        me.totalCostsView = me.createTotalCostsView();

        me.totalCostsFloatContainer = me.createTotalCostsFloatContainer();

        me.totalCostsContainer = me.createTotalCostsContainer();

        return me.totalCostsContainer;
    },

    /**
     * @return { Ext.container.Container }
     */
    createTotalCostsContainer: function() {
        var me = this;

        return Ext.create('Ext.container.Container', {
            flex: 1,
            name: 'totalCostsContainer',
            layout: 'hbox',
            items: [
                me.createLeftContainer(),
                me.createArticleInfoContainer(),
                me.createLastOrdersContainer(),
                me.totalCostsFloatContainer
            ]
        });
    },

    createArticleInfoContainer: function() {
        var me = this;

        return Ext.create('Ext.container.Container', {
            layout: 'hbox',
            style: {
                marginLeft: '50px',
            },
            items: [
                me.articleInfoView
            ]
        });
    },

    createArticleInfoView: function() {
        var me = this;


        return Ext.create('Ext.view.View', {
            id: 'articleInfoView',
            name: 'articleInfoView',
            store: me.articleInfoStore,
            width: 150,
            tpl: me.createArticleInfoTemplate()
        });
    },

    createArticleInfoTemplate: function() {
        var me = this;

        me.articleInfoTemplate = new Ext.XTemplate(
            '{literal}<tpl for=".">',
            '<div style="font-size: 13px;">',
                '<p>' + me.snippets.instock + '{instock}</p>',
                '<p>' + me.snippets.preOrders + '{preorders}</p><p></p>',
            '</div>',
            '</tpl>{/literal}'
        );

        return me.articleInfoTemplate;
    },

    createLastOrdersContainer: function() {
        var me = this;

        return Ext.create('Ext.container.Container', {
            name: 'lastOrdersContainer',
            layout: 'hbox',
            items: [
                me.lastOrderView1,
                me.lastOrderView2,
                me.lastOrderView3
            ],
            style: {
                marginLeft: '50px'
            }
        });
    },

    createLastOrderView: function(viewNumber) {
        var me = this;

        return Ext.create('Ext.view.View', {
            id: 'lastOrdersView' + viewNumber,
            name: 'lastOrdersView' + viewNumber,
            store: me.articleInfoStore,
            width: 250,
            tpl: me.createLastOrderTemplate(viewNumber)
        });
    },

    createLastOrderTemplate: function(viewNumber) {
        var me = this;

        return new Ext.XTemplate(
            '{literal}<tpl for=".">',
            '<div style="font-size: 13px;">',
                '<p>' + me.snippets.ordernumber + '{ordernumber' + viewNumber + '}</p>',
                '<p>' + me.snippets.price + '{price' + viewNumber + '} ' + me.currencySymbol + '</p>',
                '<p>' + me.snippets.quantity + '{quantity' + viewNumber + '}</p>',
            '</div>',
            '</tpl>{/literal}'
        );
    },

    updateArticleInfo: function() {
        var me = this;

        me.articleInfoView.bindStore(me.articleInfoStore);
        me.lastOrderView1.bindStore(me.articleInfoStore);
        me.lastOrderView2.bindStore(me.articleInfoStore);
        me.lastOrderView3.bindStore(me.articleInfoStore);

        me.articleInfoView.tpl = me.createArticleInfoTemplate();
        me.lastOrderView1.tpl = me.createLastOrderTemplate(1);
        me.lastOrderView2.tpl = me.createLastOrderTemplate(2);
        me.lastOrderView3.tpl = me.createLastOrderTemplate(3);
    },

    /**
     * @return { Ext.container.Container }
     */
    createTotalCostsFloatContainer: function() {
        var me = this;

        return Ext.create('Ext.container.Container', {
            layout: {
                type: 'hbox',
                pack: 'end'
            },
            style: {
                paddingRight: '20px',
            },
            height: 100,
            overflowY: 'auto',
            flex: 1,
            items: [
                me.overviewPriceView,
                me.totalCostsLabelsView,
                me.totalCostsView
            ]
        });
    },

    /**
     * @return { Ext.view.View }
     */
    createTotalCostsView: function() {
        var me = this;

        return Ext.create('Ext.view.View', {
            id: 'totalCostsView',
            name: 'totalCostsView',
            store: me.totalCostsStore,
            width: 85,
            tpl: me.createTotalCostsTemplate()
        });
    },

    /**
     * @return { Ext.view.View }
     */
    createOverviewPriceView: function() {
        var me = this;

        return Ext.create('Ext.view.View', {
            id: 'overviewPriceView',
            name: 'overviewPriceView',
            store: me.totalCostsStore,
            height: 100,
            tpl: this.createOverviewPriceTemplate()
        });
    },

    /**
     * @returns { Ext.XTemplate }
     */
    createOverviewPriceTemplate: function() {
        var me = this;

        me.overviewTempalte = new Ext.XTemplate(
            '{literal}<tpl for=".">',
            '<div style="padding-left: 10px; font-size: 13px; text-align: right; margin-right: 10px; margin-bottom: 15px;">',
                '<p><b>Gewinn: {profit} ' + me.currencySymbol + '</b></p>',
                '<p>EK: {purchaseprice} ' + me.currencySymbol + '</p>',
            '</div>',
            '<div style="padding-left: 10px; font-size: 13px; text-align: right; margin-right: 10px;">',
                '<p><b>Gewinn Auswahl: {profitPerSelection} ' + me.currencySymbol + '</b></p>',
                '<p>EK Auswahl: {purchasePricePerSelection} ' + me.currencySymbol + '</p>',
            '</div>',
            '</tpl>{/literal}',
            {

                formatNumber: function(value) {
                    return value.toFixed(2);
                }
            }
        );



        return me.overviewTempalte;
    },

    /**
     * @return { Ext.view.View }
     */
    createTotalCostsLabelsView: function() {
        var me = this;

        return Ext.create('Ext.view.View', {
            id: 'totalCostsLabelsView',
            name: 'totalCostsLabelsView',
            store: me.totalCostsStore,
            height: 100,
            tpl: this.createTotalLabelTemplate()
        });
    },

    /**
     * @returns { Ext.XTemplate }
     */
    createTotalLabelTemplate: function() {
        var me = this;

        me.totalLabelTempalte = new Ext.XTemplate(
            '{literal}<tpl for=".">',
            '<div style="font-size: 13px;">',
                '<p>' + me.snippets.sum + '</p>',
                '<p>' + me.snippets.shippingCosts + '</p>',
                '<p><b>' + me.snippets.total + '</b></p>',
                '<p>' + me.snippets.totalWithoutTax + '</p>',
                '<tpl for="." if="proportionalTaxCalculation">',
                    '<tpl for="taxes"><p>' + me.snippets.totalTaxPrefix + '{taxRate}' + me.snippets.totalTaxSuffix + '</p></tpl>',
                '<tpl else>',
                    '<p>' + me.snippets.taxSum + '</p>',
                '</tpl>',
                '</div>',
            '</tpl>{/literal}',
        );

        return me.totalLabelTempalte;
    },

    /**
     * @returns { Ext.XTemplate }
     */
    createTotalCostsTemplate: function() {
        var me = this;

        me.totalCostsTempalte = new Ext.XTemplate(
            '{literal}<tpl for=".">',
            '<div style="padding-left: 10px; font-size: 13px; text-align: right;">',
                '<p>{sum} ' + me.currencySymbol + '</p>',
                '<p>{shippingCosts:this.shippingCosts} ' + me.currencySymbol + '</p>',
                '<p><b>{total} ' + me.currencySymbol + '</b></p>',
                '<p>{totalWithoutTax} ' + me.currencySymbol + '</p>',
                '<tpl for="." if="proportionalTaxCalculation">',
                    '<tpl for="taxes"><p>{tax:this.formatNumber} ' + me.currencySymbol + '</p></tpl>',
                '<tpl else>',
                    '<p>{taxSum} ' + me.currencySymbol + '</p>',
                '</tpl>',
            '</div>',
            '</tpl>{/literal}',
            {
                shippingCosts: function(shippingCosts) {
                    if (me.displayNetCheckbox.getValue())
                    // Show net shipping costs if net order
                        return me.totalCostsModel.get('shippingCostsNet');

                    return shippingCosts;
                },

                formatNumber: function(value) {
                    return value.toFixed(2);
                }
            }
        );

        return me.totalCostsTempalte;
    },

    /**
     * @returns { Shopware.apps.SwagBackendOrder.store.TotalCosts }
     */
    createTotalCostsStore: function() {
        var me = this;

        me.totalCostsModel = Ext.create('Shopware.apps.SwagBackendOrder.model.TotalCosts', {});
        me.totalCostsModel.set('totalWithoutTax', 0);
        me.totalCostsModel.set('sum', 0);
        me.totalCostsModel.set('total', 0);
        me.totalCostsModel.set('shippingCosts', 0);
        me.totalCostsModel.set('taxSum', 0);
        me.totalCostsModel.set('proportionalTaxCalculation', false);
        me.totalCostsModel.set('taxes', []);

        me.totalCostsStore = me.subApplication.getStore('TotalCosts');
        me.totalCostsStore.add(me.totalCostsModel);

        return me.totalCostsStore;
    },

    /**
     * @returns { Shopware.apps.SwagBackendOrder.store.OverviewPrice }
     */
    createOverviewPriceStore: function() {
        var me = this;

        me.overviewPriceModel = Ext.create('Shopware.apps.SwagBackendOrder.model.OverviewPrice', {});
        me.overviewPriceModel.set('purchaseprice', 0);
        me.overviewPriceModel.set('profit', 0);
        me.overviewPriceModel.set('purchasePricePerSelection', 0);
        me.overviewPriceModel.set('profitPerSelection', 0);

        me.overviewPriceStore = me.subApplication.getStore('OverviewPrice');
        me.overviewPriceStore.add(me.overviewPriceModel);

        return me.overviewPriceStore;
    },

    createArticleInfoStore: function() {
        var me = this;

        me.articleInfoModel = Ext.create('Shopware.apps.SwagBackendOrder.model.ArticleInfo');
        
        me.articleInfoModel.set('instock', 0);
        me.articleInfoModel.set('preorders', 0);
        me.articleInfoModel.set('ordernumber1', '');
        me.articleInfoModel.set('ordernumber2', '');
        me.articleInfoModel.set('ordernumber3', '');
        me.articleInfoModel.set('price1', 0.00);
        me.articleInfoModel.set('price2', '');
        me.articleInfoModel.set('price3', 0.00);
        me.articleInfoModel.set('quantity1', 0);
        me.articleInfoModel.set('quantity2', 0);
        me.articleInfoModel.set('quantity3', 0);

        me.articleInfoStore = me.subApplication.getStore('ArticleInfo');
        me.articleInfoStore.add(me.articleInfoModel);

        return me.articleInfoStore;
    },

    updateTotalCostsEvents: function() {
        var me = this;

        me.positionStore = me.subApplication.getStore('Position');

        me.positionStore.on('update', function() {
            me.updateTotalCosts();
        });

        me.positionStore.on('remove', function() {
            me.fireEvent('calculateBasket');
            me.updateTotalCosts();
        });

        me.currencyStore.on('load', function() {
            me.updateCurrency();
            me.updateArticleInfo();
        });

        me.currencyStore.on('update', function() {
            me.updateCurrency();
        });

        me.totalCostsStore.on('update', function() {
            me.updateTotalCosts();
        });
    },

    updateArticleInfoEvents: function() {
        var me = this;

        me.articleInfoStore.on('update', function() {
            me.updateArticleInfo();
        })
    },

    updateTotalCosts: function() {
        var me = this;

        me.remove('totalCostsContainer', true);
        me.totalCostsView.bindStore(me.totalCostsStore);
        me.totalCostsLabelsView.bindStore(me.totalCostsStore);
        me.overviewPriceView.bindStore(me.overviewPriceStore);
        me.add(me.totalCostsContainer);
        me.doLayout();

    },

    updateCurrency: function() {
        var me = this,
            currencyIndex, currencyModel;

        currencyIndex = me.currencyStore.findExact('selected', 1);
        currencyModel = me.currencyStore.getAt(currencyIndex);

        if (typeof currencyModel !== "undefined") {
            me.currencySymbol = currencyModel.get('symbol');
            me.totalCostsView.tpl = me.createTotalCostsTemplate();
            me.overviewPriceView.tpl = me.createOverviewPriceTemplate();
            me.updateTotalCosts();
        }
    },

    /**
     * @returns { Ext.form.field.Checkbox }
     */
    createDisplayNetCheckbox: function() {
        var me = this;

        me.displayNetCheckbox = Ext.create('Ext.form.field.Checkbox', {
            boxLabel: '{s name="display_net"}{/s}',
            inputValue: true,
            uncheckedValue: false,
            padding: '0 5 0 0'
        });

        return me.displayNetCheckbox;
    },

    /**
     * @returns { Ext.form.field.Checkbox }
     */
    createSendMailCheckbox: function() {
        var me = this;

        me.sendMailCheckbox = Ext.create('Ext.form.field.Checkbox', {
            boxLabel: '{s name="send_mail"}{/s}',
            inputValue: true,
            uncheckedValue: false,
            padding: '0 5 0 0'
        });

        return me.sendMailCheckbox;
    },

    /**
     * @returns { Ext.container.Container }
     */
    createLeftContainer: function() {
        var me = this;

        return Ext.create('Ext.container.Container', {
            layout: 'vbox',
            items: [
                me.createDisplayNetCheckbox(),
                me.createTaxFreeCheckbox(),
                me.createSendMailCheckbox()
            ]
        });
    },


    /**
     * @returns { Ext.form.field.Checkbox }
     */
    createTaxFreeCheckbox: function() {
        var me = this;

        me.taxFreeCheckbox = Ext.create('Ext.form.field.Checkbox', {
            boxLabel: '{s name="tax_free"}{/s}',
            inputValue: true,
            uncheckedValue: false,
            padding: '0 5 0 0'
        });

        return me.taxFreeCheckbox;
    },

    /**
     * reads the plugin configuration
     */
    getPluginConfig: function() {
        var me = this;

        Ext.Ajax.request({
            url: '{url action=getPluginConfig}',
            success: Ext.bind(me.onReceivePluginConfig, me)
        });
    },

    /**
     * @param { object } response
     */
    onReceivePluginConfig: function(response) {
        var me = this,
            pluginConfigObj = Ext.decode(response.responseText),
            sendMail = pluginConfigObj.data.sendMail;

        me.orderModel.set('sendMail', sendMail);
        me.sendMailCheckbox.setValue(sendMail);
    }
});
//
//{/block}
