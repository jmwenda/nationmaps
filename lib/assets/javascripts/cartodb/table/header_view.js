
/**
 * header cell view, manages operations on table columns
 */

(function() {

var HeaderView = cdb.admin.HeaderView = cdb.core.View.extend({

  events: {
    'dblclick .coloptions':     '_renameColumn',
    'click    .coloptions':     'showColumnOptions',
    'click    .coltype':        'showColumnTypeOptions',
    'click    .geo':            'showGeoreferenceWindow',
    'keydown  .col_name_edit':  '_checkEditColnameInput',
    'focusout input':           '_finishEdit',
    'click':                    'activateColumnOptions'
  },

  initialize: function() {
    var self = this;
    this.column = this.options.column;
    this.table = this.options.table;
    this.template = this.getTemplate('table/views/table_header_view');
    this.editing_name = false;
    this.changing_type = false;

    if (HeaderView.colOptions === undefined) {
      HeaderView.colOptions= new cdb.admin.HeaderDropdown({
        position: 'position',
        horizontal_position: "right",
        tick: "right",
        template_base: "table/views/table_header_options",
        sqlView: this.options.sqlView
      });
      HeaderView.colOptions.render();

      cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
    }

    if (HeaderView.colTypeOptions === undefined) {
      HeaderView.colTypeOptions= new cdb.admin.ColumntypeDropdown({
        position: 'position',
        horizontal_position: "right",
        tick: "right",
        template_base: "table/views/table_column_type_options"
      });
      HeaderView.colTypeOptions.render();
      cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
    }

  },

  render: function() {
    this.$el.html('');

    this.$el.append(this.template({
      col_name:         this.column[0],
      col_type:         this.column[1],
      editing_name:     this.editing_name,
      changing_type:    this.changing_type,
      isReservedColumn: this.table.data().isReadOnly() || this.table.isReservedColumn(this.column[0])
    }));

    // Focus in the input if it is being edited
    // and set the correct width
    if (this.editing_name) {
      var w = this.$el.find("p.auto").width();
      this.$el.find("input")
        .css({
          "max-width":  w,
          "width":      w
        })
        .focus();
    }

    this.delegateEvents();

    return this;
  },

  _openColOptions: function(e) {
    var self = this;
    var colOptions = HeaderView.colOptions;

    // Unbind events
    colOptions.off();
    cdb.god.unbind('closeDialogs', HeaderView.colOptions.hide, HeaderView.colOptions);

    // Close other dialogs
    cdb.god.trigger("closeDialogs");

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    colOptions.bind('renameColumn', this._renameColumn, this);
    colOptions.bind('changeType', this._changeType, this);
    colOptions.bind('georeference', function(column) {
        self.trigger('georeference', column);
    }, this);
    colOptions.bind('applyFilter', function(column, filter) {
        self.trigger('applyFilter', column, filter);
    }, this);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);

    var link_width  = $(e.target).width() + 26
      , th          = container.parent();

    // align to the right of the target with a little of margin
    colOptions.openAt(link_width - colOptions.$el.width(), (th.height()/2) + 7);

    // Bind again!
    cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
  },

  _openColTypeOptions: function(e) {
    if(this.table.data().isReadOnly()) {
      return;
    }
    var colOptions = HeaderView.colTypeOptions;

    // Unbind events
    colOptions.off();
    cdb.god.unbind('closeDialogs', HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);

    // Close other dialogs
    cdb.god.trigger("closeDialogs");

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);

    var link_width  = $(e.target).outerWidth() + 24
      , th          = container.parent();

    // align to the right of the target with a little of margin
    colOptions.openAt(link_width - colOptions.$el.width(), (th.height()/2) + 25);


    // Bind again
    cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
  },

  _checkEditColnameInput: function(e) {
    if(e.keyCode === 13) {
      this._submitEdit();
    }
    if(e.keyCode === 27) {
      this._finishEdit();
    }

  },

  _submitEdit: function() {
    this.table.renameColumn(this.column[0], $('.col_name_edit').val());
    this._finishEdit();
  },

  _finishEdit: function() {
    this.editing_name = false;
    this.render();
  },

  _renameColumn: function(ev) {
    if (ev) {
      this.killEvent(ev)
    }

    this.editing_name = true;
    this.changing_type = false;
    this.render();
  },

  _changeType: function(column) {
    this.editing_name = false;
    this.changing_type = true;

    // Simulate click
    var $coltype_link = this.$el.find('a.coltype');
    $coltype_link.click();
  },

  activateColumnOptions: function(e) {
    this.killEvent(e);
    this.$el.find("a.coloptions").click();
  },

  showColumnOptions: function(e) {
    var self = this;
    e.preventDefault();

    var colOptions = HeaderView.colOptions;
    colOptions.hide(function() {
      colOptions.parent_ && colOptions.parent_.css('z-index', 0);
      var parent_ = self.$el.find('th > div');
      colOptions.parent_ = parent_;
      parent_.css('z-index', '100');
      self._openColOptions(e);
    });
    return false;
  },

  showGeoreferenceWindow: function(e) {
    this.killEvent(e);
    this.trigger('georeference', null);
  },

  showColumnTypeOptions: function(e) {
    var self = this;
    if (e)
      e.preventDefault();
    var colOptions = HeaderView.colTypeOptions;
    colOptions.hide(function() {
      self._openColTypeOptions(e);
    });
    return false;
  }

});

})();
