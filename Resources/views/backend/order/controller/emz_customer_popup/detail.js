//{block name="backend/order/controller/detail"}
//{$smarty.block.parent}
Ext.define('Shopware.apps.EmzCustomerPopup.controller.Detail', {
    override: 'Shopware.apps.Order.controller.Detail',

    onShowDetail: function(record) {
        var me = this;

        me.callParent(arguments);

        var customerID = record.data.customerId;
        
        if(record.getCustomerStore.data.items.length > 0) {
            var comment = record.getCustomerStore.data.items[0].data.internalComment;

            if(comment != "") {
                alert(comment);
            }
        }
    }
});
//{/block}