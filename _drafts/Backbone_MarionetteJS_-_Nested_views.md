Il arrive très souvent qu'on souhaite créer des vues dans des vues.
MarionetteJS introduit la notion de Layout permettant de découper une page en plusieurs régions dans les pages ou encore le module Backbone.Babysitter permettant de gérer plusieurs vues.
Cependant, il n

var CollectionView = Marionette.CollectionView.extend({
        // Set an empty collection to bypass Marionette.CollectionView parameters validation
        collection: new Backbone.Collection(),
        /**
         * Override the Marionette.CollectionView._renderChildren function in order to display the nested views HTML
         * @private
         */
        _renderChildren: function() {
            var self = this;
            var views = this._getCollectionViews();
            _.each(views, function(view, index) {
                // set up the child view event forwarding
                self.addChildViewEventForwarding(view);

                // this view is about to be added
                self.triggerMethod('before:item:added', view);

                // Store the child view itself so we can properly
                // remove and/or close it later
                self.children.add(view);

                // Render it and show it
                self.renderItemView(view, index);

                // call the 'show' method if the collection view
                // has already been shown
                if (self._isShown) {
                    Marionette.triggerMethod.call(view, 'show');
                }

                // this view was added
                self.triggerMethod('after:item:added', view);
            });
        },
        /**
         * Get the collection views
         * @returns {array} the collection views, throws error if not found
         */
        _getCollectionViews: function() {
            var collectionViews = Marionette.getOption(this, 'collectionViews');

            if (!collectionViews) {
                throw new Error('An collectionViews must be specified', 'NoCollectionViewsError');
            }

            return collectionViews;
        },
        /**
         * Add a wake up function for tab switching purpose
         */
        wakeUp: function() {
            var views = this._getCollectionViews();
            _.each(views, function(view) {
                view.delegateEvents();
            });
        }
    });
