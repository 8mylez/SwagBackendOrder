//{block name="backend/order/controller/detail"}
//{$smarty.block.parent}
Ext.define('Shopware.apps.EmzCustomerPopup.controller.Detail', {
    override: 'Shopware.apps.Order.controller.Detail',

    onShowDetail: function(record) {
        var me = this;

        me.callParent(arguments);

        var customerID = record.data.customerId,
            customerStore = Ext.create('Shopware.apps.Customer.store.Detail');
        
        customerStore.getProxy().extraParams.customerID = customerID;

        customerStore.load({
            callback: function(records) {
                if(records.length > 0) {
                    var comment = records[0].data.internalComment;

                    if(comment != null && comment != "") {
                        alert(comment);
                    }
                }
            }
        });
    }
});
//{/block}