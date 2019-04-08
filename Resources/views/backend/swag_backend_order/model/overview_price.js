/**
 * Model which holds the total costs for the data view
 */
// {block name="backend/create_backend_order/model/overview_price"}
//
Ext.define('Shopware.apps.SwagBackendOrder.model.OverviewPrice', {

    /**
     * extends from the standard ExtJs Model
     */
    extend: 'Ext.data.Model',

    /**
     * convert functions to get '0.00' digits
     */
    fields: [
        {
            name: 'purchaseprice',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        },
        {
            name: 'profit',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        },
        {
            name: 'purchasePricePerSelection',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        },
        {
            name: 'profitPerSelection',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        },
    ]
});
//
// {/block}
