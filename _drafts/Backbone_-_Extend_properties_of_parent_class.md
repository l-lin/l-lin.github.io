var Tab = Backbone.Model.extend({
        defaults: {
            i18nName: '',
            isCloseable: true,
            isActive: false,
            isNeverActive: false,
            buttonGlyphicon: '',
            hasGlyphicon: false,
            className: ''
        }
    });

    /**
     * The '+' tab
     */
    var PlusTab = Tab.extend({
        defaults: function() {
            var tmp = _.clone(this.constructor.__super__.defaults);
            return _.extend(tmp, {
                i18nName: 'plus',
                buttonGlyphicon: 'glyphicon glyphicon-plus',
                isCloseable: false,
                isNeverActive: true,
                hasGlyphicon: true,
                className: 'plus-tab'
            });
        }
    });
