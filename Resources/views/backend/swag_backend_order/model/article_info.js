Ext.define('Shopware.apps.SwagBackendOrder.model.ArticleInfo', {

    extend: 'Ext.data.Model',

    fields: [
        {
            name: 'instock',
            type: 'int'
        }, {
            name: 'preorders',
            type: 'int'
        }, {
            name: 'ordernumber1',
            type: 'string'
        }, {
            name: 'ordernumber2',
            type: 'string'
        }, {
            name: 'ordernumber3',
            type: 'string'
        }, {
            name: 'price1',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        }, {
            name: 'price2',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        }, {
            name: 'price3',
            type: 'float',
            convert: function (v) {
                var value = parseFloat(v);
                if (value === '' || isNaN(value)) {
                    value = 0.0;
                }
                return value.toFixed(2);
            }
        }, {
            name: 'quantity1',
            type: 'int'
        }, {
            name: 'quantity2',
            type: 'int'
        }, {
            name: 'quantity3',
            type: 'int'
        }
    ]
});