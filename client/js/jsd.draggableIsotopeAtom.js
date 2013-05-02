/**
* The purpose of this jQuery UI plugin is to account for the bug in Firefox that doesn't correctly report the positions
* of elements that are positioned with CSS transforms. Luckily, isotope keeps track of what the position should be, so
* we can calculate the correct offset.
*
* @author: John Starr Dewar
*/
(function($) {
   // Arguments to .extend are returned object, merge object 1, merge object 2
    $.widget('jsd.draggableIsotopeAtom', $.ui.draggable, {

        _create: function () {
            this.element.data("draggable", this);
            $.ui.draggable.prototype._create.call(this);
            // this._super('_create');
        },

        _setOption: function (key, value) {
            $.ui.draggable.prototype._setOption.call(this, key, value);
            // this._super('_setOption', key, value);
        },

        _mouseStart : function (event) {
            var o = this.options;

            //Create and append the visible helper
            this.helper = this._createHelper(event);

            //Cache the helper size
            this._cacheHelperProportions();

            //If ddmanager is used for droppables, set the global draggable
            if($.ui.ddmanager)
                $.ui.ddmanager.current = this;

            /*
* - Position generation -
* This block generates everything position related - it's the core of draggables.
*/

            //Cache the margins of the original element
            this._cacheMargins();

            //Store the helper's css position
            this.cssPosition = this.helper.css("position");
            this.scrollParent = this.helper.scrollParent();

            // ****** HERE BE THE CUSTOM CODE WE EXTENDED FOR -- everything else is copy-and-pasted from ui.draggable
            var parentOffset = this.element.parent().offset();
            var isotopePosition = this.element.data('isotopeItemPosition');

            //The element's absolute position on the page minus margins
            this.offset = this.positionAbs = {
                left: parentOffset.left + isotopePosition.x - this.margins.top,
                top: parentOffset.top + isotopePosition.y - this.margins.left
            };
            // ******

            $.extend(this.offset, {
                click: { //Where the click happened, relative to the element
                    left: event.pageX - this.offset.left,
                    top: event.pageY - this.offset.top
                },
                parent: this._getParentOffset(),
                relative: this._getRelativeOffset() //This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
            });

            //Generate the original position
            this.originalPosition = this.position = this._generatePosition(event);
            this.originalPageX = event.pageX;
            this.originalPageY = event.pageY;

            //Adjust the mouse offset relative to the helper if 'cursorAt' is supplied
            (o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt));

            //Set a containment if given in the options
            if(o.containment)
                this._setContainment();

            //Trigger event + callbacks
            if(this._trigger("start", event) === false) {
                this._clear();
                return false;
            }

            //Recache the helper size
            this._cacheHelperProportions();

            //Prepare the droppable offsets
            if ($.ui.ddmanager && !o.dropBehaviour)
                $.ui.ddmanager.prepareOffsets(this, event);

            this.helper.addClass("ui-draggable-dragging");
            this._mouseDrag(event, true); //Execute the drag once - this causes the helper not to be visible before getting its correct position

            //If the ddmanager is used for droppables, inform the manager that dragging has started (see #5003)
            if ( $.ui.ddmanager ) $.ui.ddmanager.dragStart(this, event);

            return true;
        },

        _destroy : function () {

        }
    });
})(jQuery);