// This script sets up the overall layout of the dial-a-cluster user
// interface, making calls out to different functions for each of
// the jQuery windows.

// S. Martin
// 1/15/2015

// slick grid styling
import "../css/dac-ui.css";
import "../css/slickGrid/slick.grid.css";
import "../css/slickGrid/slick-default-theme.css";
import "../css/slickGrid/slick.headerbuttons.css";
import "../css/slickGrid/slick-slycat-theme.css";

// dial-a-cluster ui
import client from "js/slycat-web-client";
import * as dialog from "js/slycat-dialog";
import layout from "./dac-layout.js";
import request from "./dac-request-data.js";
import alpha_sliders from "./dac-alpha-sliders.js";
import alpha_buttons from "./dac-alpha-buttons.js";
import scatter_plot from "./dac-scatter-plot.js";
import plots from "./dac-plots.js";
import metadata_table from "./dac-table.js";
import selections from "./dac-manage-selections.js";
import URI from "urijs";
import "bootstrap";
import "js/jquery.layout-latest.min.js";
import "./jquery-ui-1.10.4.custom.min.js";

// edit and info pulldowns
//import "js/dac-parse-log.js";

// Wait for document ready
$(document).ready(function() {

    // controls on top or above scatter plot
    var CONTROL_BAR = "scatter-plot";

    // maximum number of points to display for plots
    var MAX_TIME_POINTS = 500;

    // maximum number of plots (per selection)
    var MAX_NUM_PLOTS = 50;

    // animation threshold
    var MAX_POINTS_ANIMATE = null;

    // focus selection color
    var FOCUS_COLOR = "black";

    // scatter plot points (circles or squares)
    var SCATTER_PLOT_TYPE = "circle";

    // variable/metadata inclusion columns
    var var_include_columns = null;
    var meta_include_columns = null;

    // colormap defaults
    var cont_colormap = null;
    var disc_colormap = null;

    // model id from address bar
    var mid = URI(window.location).segment(-1);

    // constants for polling timeouts
    var ONE_MINUTE = 60000;
    var ONE_SECOND = 1000;

    // constants for cutting off plot names, slider names
    var MAX_PLOT_NAME = 20;
    var MAX_SLIDER_NAME = 20;
    var MAX_COLOR_NAME = 20;

    // constant for maximum number of editable column categories
    var MAX_CATS = 50;
     // constant for maximum length of freetext in editable column
    var MAX_FREETEXT_LEN = 500;

    // waits 1 minute past last successful progress update
    var endTime = Number(new Date()) + ONE_MINUTE;

    // polling interval is 1 second
    var interval = ONE_SECOND;

    // if user is looking at textarea then don't scroll to bottom
    var user_scroll = false;
    $("#dac_processing_textarea").focus (function () { user_scroll = true });
    $("#dac_processing_textarea").focusout(function () { user_scroll = false });

    // poll database for artifact "dac-poll-progress"
    (function poll() {

        client.get_model_parameter(
        {
            mid: mid,
            aid: "dac-polling-progress",
            success: function (result)
            {

                if (result[0] == "Done") {

                    // done uploading to database
                    check_preferences();

                } else if (result[0] == "Error") {

                    dialog.ajax_error ("Server error: " + result[1] + ".")("","","");

                } else {

                    // update progress and output log
                    $("#dac_processing_progress_bar").width(result[1] + "%");
                    $("#dac_processing_progress_bar").text(result[0]);

                    // request error log
                    $.when(request.get_parameters("dac-parse-log")).then(
                        function(error_log)
                        {
                            // update text box unless user has focused on it
                            if (user_scroll == false) {
                                // display text then scroll to bottom
                                $("#dac_processing_textarea").text(error_log[1]);

                                // scroll to bottom
                                $("#dac_processing_textarea").scrollTop($("#dac_processing_textarea")[0].scrollHeight);
                            }
                        });

                    // reset time out and continue
                    endTime = Number(new Date()) + ONE_MINUTE;
                    window.setTimeout(poll, interval);
                }
            },
            error: function () {

                if (Number(new Date()) < endTime) {

                    // check model for existence of "dac-polling-progress" artifact
                    client.get_model(
                    {
                        mid: mid,
                        success: function (result)
                        {
                            // if "dac-polling-progress" doesn't exist it's an older model, just load it
                            if (!("artifact:dac-polling-progress" in result))
                            {
                                check_preferences();
                            } else {

                                // otherwise keep trying, do not reset timer
                                window.setTimeout(poll, interval);

                            }
                        },
                        error: function ()
                        {
                            // couldn't even load model? -- give up
                            check_preferences();
                        }
                    });

                } else {
                    // all else fails -- give up
                    check_preferences();
                }
            }
        });
    })();

    // check for preferences, and set up variable
    function check_preferences ()
    {

        // get artifacts in model (to see if user has modified preferences
        client.get_model (
        {
            mid: mid,
            success: function (result)
            {
                // check for preference variables
                if (("artifact:dac-var-include-columns" in result) &&
                    ("artifact:dac-metadata-include-columns" in result) &&
                    ("artifact:dac-cont-colormap" in result) &&
                    ("artifact:dac-disc-colormap" in result) &&
                    ("artifact:dac-options" in result)) {

                    // load preference data
                    $.when(request.get_parameters("dac-var-include-columns", mid),
                           request.get_parameters("dac-metadata-include-columns", mid),
                           request.get_parameters("dac-cont-colormap", mid),
                           request.get_parameters("dac-disc-colormap", mid),
                           request.get_parameters("dac-options", mid)).then(
                           function (var_include, meta_include, cont_color, disc_color, options) {

                                // set var/meta inclusion
                                var_include_columns = var_include[0];
                                meta_include_columns = meta_include[0];

                                // set colormaps
                                cont_colormap = JSON.parse(cont_color[0][0]);
                                disc_colormap = JSON.parse(disc_color[0][0]);

                                // set options -- label length
                                MAX_PLOT_NAME = options[0][0];
                                MAX_COLOR_NAME = options[0][0];
                                MAX_SLIDER_NAME = options[0][0];

                                // set options -- plots
                                MAX_TIME_POINTS = options[0][1];
                                MAX_NUM_PLOTS = options[0][2];

                                // set options -- animation
                                MAX_POINTS_ANIMATE = options[0][3];

                                // set options -- scatter plot type
                                SCATTER_PLOT_TYPE = options[0][4];

                                // set options -- control bar
                                CONTROL_BAR = options[0][5];

                                // set options -- editable columns
                                // if statement to ensure backwards compatiblity
                                if (options[0].length > 6) {
                                    MAX_CATS = options[0][6];
                                    MAX_FREETEXT_LEN = options[0][7];
                                };

                                // start model
                                launch_model();

                     });



                } else {

                    // no preferences found, launch model with defaults
                    launch_model();

                }
            },
            error: function () {

                // couldn't load model -- try to launch anyway (forget about preferences)
                launch_model();

            }
        });
    }


    // setup and launch model
    function launch_model ()
    {

    	// load ui parameters and initialize dial-a-cluser layout
	    $.when (request.get_parameters("dac-ui-parms", mid)).then(
			function (ui_parms)
			{

    			// the step size for the alpha slider (varies from 0 to 1)
    			var ALPHA_STEP = parseFloat(ui_parms["ALPHA_STEP"]);

    			// default width for the alpha sliders (in pixels)
                //var ALPHA_SLIDER_WIDTH = parseInt(ui_parms["ALPHA_SLIDER_WIDTH"]);
     			// updated for download button
    			var ALPHA_SLIDER_WIDTH = 190;

    			// default height of alpha buttons (in pixels)
    			var ALPHA_BUTTONS_HEIGHT = parseInt(ui_parms["ALPHA_BUTTONS_HEIGHT"]);

				// number of points over which to stop animation
				if (MAX_POINTS_ANIMATE == null) {
				    MAX_POINTS_ANIMATE = parseInt(ui_parms["MAX_POINTS_ANIMATE"]);
				};

				// border around scatter plot (fraction of 1)
				var SCATTER_BORDER = parseFloat(ui_parms["SCATTER_BORDER"]);

				// scatter button toolbar height
				var SCATTER_BUTTONS_HEIGHT = parseInt(ui_parms["SCATTER_BUTTONS_HEIGHT"]);

				// scatter plot colors (css/d3 named colors)
				var POINT_COLOR = ui_parms["POINT_COLOR"];
				var POINT_SIZE = parseInt(ui_parms["POINT_SIZE"]);
				var NO_SEL_COLOR = ui_parms["NO_SEL_COLOR"];
				var SELECTION_1_COLOR = ui_parms["SELECTION_1_COLOR"];
				var SELECTION_2_COLOR = ui_parms["SELECTION_2_COLOR"];
				var COLOR_BY_LOW = ui_parms["COLOR_BY_LOW"];
				var COLOR_BY_HIGH = ui_parms["COLOR_BY_HIGH"];
				var OUTLINE_NO_SEL = parseInt(ui_parms["OUTLINE_NO_SEL"]);
				var OUTLINE_SEL = parseInt(ui_parms["OUTLINE_SEL"]);

				// pixel adjustments for d3 time series plots
				var PLOT_ADJUSTMENTS = {
					PLOTS_PULL_DOWN_HEIGHT: parseInt(ui_parms["PLOTS_PULL_DOWN_HEIGHT"]),
					PADDING_TOP: parseInt(ui_parms["PADDING_TOP"]),
					PADDING_BOTTOM: parseInt(ui_parms["PADDING_BOTTOM"]),
					PADDING_LEFT: parseInt(ui_parms["PADDING_LEFT"]),
					PADDING_RIGHT: parseInt(ui_parms["PADDING_RIGHT"]),
					X_LABEL_PADDING: parseInt(ui_parms["X_LABEL_PADDING"]),
					Y_LABEL_PADDING: parseInt(ui_parms["Y_LABEL_PADDING"]),
					LABEL_OPACITY: parseFloat(ui_parms["LABEL_OPACITY"]),
					X_TICK_FREQ: parseInt(ui_parms["X_TICK_FREQ"]),
					Y_TICK_FREQ: parseInt(ui_parms["Y_TICK_FREQ"]),
				};

	            // Remove progress element from DOM
	            $('#dac-progress-feedback').remove();

	            // set up jQuery layout for user interface
				layout.setup (ALPHA_SLIDER_WIDTH, ALPHA_BUTTONS_HEIGHT,
							  SCATTER_BUTTONS_HEIGHT, CONTROL_BAR);

                // set up alpha slider value change event
                document.body.addEventListener("DACAlphaValuesChanged", alpha_values_changed);

                // set up selection change event
                document.body.addEventListener("DACSelectionsChanged", selections_changed);

                // set up active selection change event
                document.body.addEventListener("DACActiveSelectionChanged", active_selection_changed);

                // set up difference calculation event
                document.body.addEventListener("DACDifferenceComputed", difference_computed);

                // set up subset change event
                document.body.addEventListener("DACSubsetChanged", subset_changed);

                // load all relevant data and set up panels
                $.when(request.get_table_metadata("dac-variables-meta", mid),
		   	           request.get_table("dac-variables-meta", mid),
		   	           request.get_table_metadata("dac-datapoints-meta", mid),
			           request.get_table("dac-datapoints-meta", mid)).then(
		   	           function (variables_meta, variables, data_table_meta, data_table)
		   	                {
                                // change variables included from null to list of indices, if necessary
                                if (var_include_columns == null) {

                                    var_include_columns = [];
                                    for (var i = 0; i < variables_meta[0]["row-count"]; i++) {
                                        var_include_columns.push(i);
                                    }
                                }

                                // change metadata included from null to list of indices, if necessary
                                if (meta_include_columns == null) {

                                    meta_include_columns = [];
                                    for (i = 0; i < data_table_meta[0]["column-count"]; i++) {
                                        meta_include_columns.push(i);
                                    }
                                }

		   	                    // set up the alpha sliders
				                alpha_sliders.setup(ALPHA_STEP, variables_meta[0]["row-count"],
				                                         variables[0]["data"][0], MAX_SLIDER_NAME,
				                                         var_include_columns);

				                // set up the alpha buttons
				                alpha_buttons.setup(variables_meta[0]["row-count"], var_include_columns);

				                // set up the time series plots
				                plots.setup(SELECTION_1_COLOR, SELECTION_2_COLOR, FOCUS_COLOR, PLOT_ADJUSTMENTS,
				                            MAX_TIME_POINTS, MAX_NUM_PLOTS, MAX_PLOT_NAME, variables_meta, variables,
				                            var_include_columns);

				                // set up the MDS scatter plot
				                scatter_plot.setup(MAX_POINTS_ANIMATE, SCATTER_BORDER, POINT_COLOR,
					                POINT_SIZE, SCATTER_PLOT_TYPE, NO_SEL_COLOR, SELECTION_1_COLOR,
					                SELECTION_2_COLOR, FOCUS_COLOR, COLOR_BY_LOW, COLOR_BY_HIGH,
					                cont_colormap, disc_colormap, MAX_COLOR_NAME, OUTLINE_NO_SEL,
					                OUTLINE_SEL, data_table_meta[0], meta_include_columns, var_include_columns);

				                // set up table
				                client.get_model(
                                {
                                    mid: mid,
                                    success: function (result)
                                    {
                                            // editable column data (initialize to empty)
                                        var editable_columns = {num_rows: 0,
                                                                attributes: [],
                                                                categories: [],
                                                                data: []};
                                            // check for editable columns
                                        if ('artifact:dac-editable-columns' in result)
                                        {
                                                // load editable columns
                                            client.get_model_parameter({
                                                mid: mid,
                                                aid: "dac-editable-columns",
                                                success: function (result)
                                                {
                                                    // initialize table with editable columns
                                                    editable_columns = result;
                                                    metadata_table.setup(data_table_meta, data_table, meta_include_columns,
                                                                            editable_columns, MAX_FREETEXT_LEN);
                                                    },
                                                error: function () {
                                                        // notify user that editable columns exist, but could not be loaded
                                                    dialog.ajax_error('Server error: could not load editable column data.')
                                                        ("","","")
                                                    metadata_table.setup(data_table_meta, data_table, meta_include_columns,
                                                                            editable_columns, MAX_FREETEXT_LEN);
                                                    }
                                            });
                                        } else {
                                                // initialize table with no editable columns
                                            metadata_table.setup(data_table_meta, data_table, meta_include_columns,
                                                                            editable_columns, MAX_FREETEXT_LEN);
                                        }
                                    }
                                });
		   	                },
		   	                function () {
		   	                    dialog.ajax_error ("Server error: could not load initial data.")("","","");

		   	                    // remove dac-plots so screen isn't so ugly
		                        for (var i = 0; i < 3; i++) {
		                            $("#dac-select-plot-" + (i+1)).remove();
		                            $("#dac-link-plot-" + (i+1)).remove();
		                            $("#dac-low-resolution-plot-" + (i+1)).remove();
		                            $("#dac-full-resolution-plot-" + (i+1)).remove();
		                            $("#dac-link-label-plot-" + (i+1)).remove();
		                            $("#dac-plots-displayed-" + (i+1)).remove();
		                            $("#dac-plots-not-displayed-" + (i+1)).remove();
		                        };

		   	                });

			},
			function ()
			{
				dialog.ajax_error ("Server failure: could not load UI parameters.")("","","");

				// remove model leaving only blank screen
				$("#dac-model").remove();
			}
	    );
    }

    // custom event for change in alpha slider values
    function alpha_values_changed (new_alpha_values)
    {
        // update actual sliders
        alpha_sliders.set_alpha_values(new_alpha_values.detail);

        // update MDS scatter plot
        scatter_plot.update(new_alpha_values.detail);
    }

    // custom event for change in selection 1, selection 2, active selection
    function selections_changed (new_selections)
    {

        // re-order selection order randomly
        // (to prevent always showing 1st part of long selection)
        selections.shuffle();

        // update focus since selection changed
        selections.update_focus();

        // update scatter plot
        scatter_plot.draw();

        // show difference out of sync
        scatter_plot.toggle_difference(false);

        // update selections in time series plot
        plots.update_plots();

		// update table - select corresponding rows (assumes they are stored in manage_selections.js)
		metadata_table.select_rows();

		// jump to top row in table for current selection (if there is one)
		metadata_table.jump_to (new_selections.detail.active_sel);
    }

    // custom event for jumping to an individual selection in the table
    function active_selection_changed (active_selection)
    {
        // update new active selection
        selections.set_focus(active_selection.detail.active_sel);

        // re-draw curves to show active selection
        plots.draw();

        // highlight in scatter plot
        scatter_plot.draw();

        // re-draw rows in table
        metadata_table.select_rows();

        // jump to focus, unless it was a defocus event
        if (active_selection.detail.active_sel != null) {
            metadata_table.jump_to ([active_selection.detail.active_sel]);
        }
    }

    // custom event for difference calculation
    function difference_computed (diff_values)
    {
        // show first three most different plots
        plots.change_selections(diff_values.detail);
    }

    // user changed subset (can change selections as well)
    function subset_changed (new_subset)
    {
        // update subset and selections
        var jump_to = selections.update_subset (new_subset.detail.new_subset);

        // re-draw curves to show new selections
        plots.draw();

        // re-draw scatter plot, before updating coordinates
        scatter_plot.draw();

        // reset zoom, if necessary
        if (new_subset.detail.zoom) {
            scatter_plot.reset_zoom();
        }

        // re-draw scatter plot, subset changed
        scatter_plot.update(alpha_sliders.get_alpha_values());

        // re-draw rows in table
        metadata_table.select_rows();

        // jump to either selection or at least subset
        if (jump_to.length > 0) {
            metadata_table.jump_to (jump_to);
        }
    }
});