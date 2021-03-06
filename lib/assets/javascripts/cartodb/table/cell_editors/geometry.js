  /**
   *  Edit Geometry dialog, comes from Small Dialog -> cell editor!
   *
   *  Associate templates:
   *    - dialog_small_edit
   *    - geometry_editor
   */


  cdb.admin.EditGeometryDialog = cdb.admin.SmallDialog.extend({

    className: "floating edit_text_dialog geometry_dialog",

    events: cdb.core.View.extendEvents({
      'keyup input':    '_keyInput',
      'keyup textarea': '_keyTextarea',
      'click .switch':  '_chooseEditor',
      'submit form': '_submit'
    }),

    initialize: function() {
      var self = this;
      _.extend(this.options, {
        template_name: 'common/views/dialog_small_edit',
        title: '',
        description: '',
        clean_on_hide: true,
        readOnly: this.options.readOnly//,
        // uncoment next lines to get geojson / point button togglers
        // additionalButtons: [
          // {
          //   title:"geoJSON",
          //   classes:"geoJSONButton link"
          // }, {
          //   title:"Point editor",
          //   classes:"pointButton link hidden"
          // },
        // ]
      });

      // Activated by default
      this.enable = true;

      // Create a fake model
      this.model = new cdb.core.Model();

      cdb.ui.common.Dialog.prototype.initialize.apply(this);

      // Render
      this.render();

      // Append to the document
      $(document.body).find("div.table table").append(this.el);
    },

    _chooseEditor: function(ev) {
      this.killEvent(ev);
      if(!this.options.readOnly) {
        var $el = $(ev.target).closest("a");

        // Change status value
        this.status = (this.status == "point") ? "rest" : "point";

        // Change switch
        $el
          .removeClass(this.status == "rest" ? "disabled" : "enabled")
          .addClass(this.status == "rest" ? "enabled" : "disabled");

        this.updateInputs();
        // Change between point to geom editor
        if (this.status == "rest") {
          this.$('.point').hide();
          this.$('.geoJSON').show();
        } else {
          this.$('.point').show();
          this.$('.geoJSON').hide();
        }
      }
    },

    updateInputs: function() {
      if(this.model.get('geojson')) {
        try {
          var geom = JSON.parse(this.model.get('geojson'));
          this.$content.find("input.longitude").val(geom.coordinates[0]);
          this.$content.find("input.latitude").val(geom.coordinates[1]);
          this.$content.find("textarea").val(JSON.stringify(geom));
        } catch(error) {
          return false;
        }

      }
    },

    render_content: function() {
      // render loading if the GeoJSON is not loaded
      var geojson = this.options.row.get('the_geom')
        , template = cdb.templates.getTemplate("table/cell_editors/views/geometry_editor") // this.options.readOnly})
        , $content = this.$content = $("<div>").append(template({"readOnly": this.options.readOnly}));
      if (this.options.row.hasGeometry()) {
        this.geojson = geojson;
        this._chooseGeom();
      } else {
        this._loadGeom();
      }

      return $content;
    },


    /**
     *  Load geom if it is not loaded
     */
    _loadGeom: function() {
      var self = this;
      this.options.row.bind('change', function() {
        self.geojson = self.options.row.get("the_geom");
        self._chooseGeom();
      }, this);
      this.options.row.fetch({
        rowNumber: this.options.rowNumber
      });
    },


    /**
     *  Choose scenario for the editor
     */
    _chooseGeom: function() {
        var geom = null;
        try {
          geom = JSON.parse(this.geojson);
        } catch(err) {
          // if the geom is not a valid json value
        }
        if(!this.options.readOnly) {
          if (!geom || geom.type.toLowerCase() == "point") {
            // Set status to point
            this.status = "point";
            // Remove other options
            this.$content.find("div.loader").remove();
            this.$content.find("div.rest").remove();
            // Fill inputs
            this.$content.find("div.point").show();
            this.$content.find("div.selector").show();
            if(geom) {
              this.$content.find("input.longitude").val(geom.coordinates[0]);
              this.$content.find("input.latitude").val(geom.coordinates[1]);
              this.$content.find("textarea").val(JSON.stringify(geom));
            }
          } else {
            // Set status to rest
            this.status = "rest";
            // Remove other options
            this.$content.find("div.loader").remove();
            this.$content.find("div.point").remove();
            // Fill textarea
            this.$content.find("div.rest").show();
            this.$content.find("textarea").val(this.geojson);
          }
        } else {
          this.$content.find("div.loader").remove();
          this.$content.find("div.selector").show();
          this.$content.find("#geoJSON").val(this.geojson);
        }

    },


    /**
     *  Check if the number is well formed or not
     */
    _checkNumber: function(number) {
      var pattern = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)$/;
      if (pattern.test(number)) {
        return true
      } else {
        return false
      }
    },


    /**
     *  Check latitude and longitude inputs
     */
    _checkInputs: function() {
      var enable = true
        , $latitude = this.$el.find("input.latitude")
        , $longitude = this.$el.find("input.longitude");

      if (this._checkNumber($latitude.val())) {
        $latitude.removeClass("error");
      } else {
        $latitude.addClass("error");
        enable = false;
      }

      if (this._checkNumber($longitude.val())) {
        $longitude.removeClass("error");
      } else {
        $longitude.addClass("error");
        enable = false;
      }

      return enable;
    },


    _submit: function(e) {
      e.preventDefault();
      this._ok();
    },


    /**
     *  When user type any number we check it if it is correct
     */
    _keyInput: function(ev) {

      if (this._checkInputs()) {
        this.enable = true;

        // Save model
        var lat = this.$el.find("input.latitude").val()
          , lon = this.$el.find("input.longitude").val();
        var geoPoint = JSON.stringify({"type": "Point", "coordinates": [lon,lat]});
        this.model.set("geojson", geoPoint);
        this.model.set("the_geom", geoPoint);
        if(ev.keyCode == 13) {
          ev.preventDefault();
          this._ok();
        }
      } else {
        this.enable = false;

        if(ev.keyCode === 13) {
          ev.preventDefault();
        }
      }
    },


    /**
     *  Key press binding for textarea
     */
    _keyTextarea: function(ev) {

      if( (ev.metaKey || ev.ctrlKey) && ev.keyCode == 13) {
        this._ok();
        ev.preventDefault();
        return false;
      }

      // Save model
      var geojson = $(ev.target).val()
      this.model.set("geojson", geojson);
    },


    /**
     *  Show dialog at position x,y
     */
    showAt: function(x, y, width, fix) {
      // Fix for point editor, it needs a min with of 280
      var minWidth = Math.max(width, 280);

      this.$el.css({
        top: y,
        left: x - ((minWidth - width) / 2),
        minWidth: minWidth
      });

      if (fix) {
        this.$el.find("textarea").css({
          minWidth: minWidth - 22
        })
      }

      this.show();
      this.$el.find("textarea, input.longitude")
        .focus()
        .select();

    },


    /**
     *  Ok button function
     */
    _ok: function(ev) {
      if(ev) ev.preventDefault();

      // If the time is not ok, the dialog is not correct
      if (!this.enable) {
        return false;
      }

      if (this.ok) {
        this.ok();
      }

      this.hide();
    },


    /**
     *  Ok function
     */
    ok: function() {
      if (this.options.res) {
        var currentGeom = this.model.get("geojson");
        this.options.res(currentGeom);
      }
    },

  });
