/*
Copyright 2013, Sandia Corporation. Under the terms of Contract
DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
rights in this software.
*/

//////////////////////////////////////////////////////////////////////////////////////////////
// Remote file browser widget, for use with the Slycat /remotes API.

$.widget("slycat.browser",
{
  options:
  {
    server_root : "",
    session : "",
    root_path : "/",
    root_label : "foo",
    multiple_selection : false,
    directory_selection : false,
    hide_dotfiles : true
  },

  _create: function()
  {
    var self = this;

    function click_arrow(item)
    {
      return function()
      {
        item.trigger("toggle-directory");
        return false;
      }
    }

    function click_directory(item)
    {
      return function()
      {
        item.trigger("toggle-directory");
        return false;
      }
    }

    function select_item(self, item)
    {
      return function(e)
      {
        if($(this).parent().is(".directory") && !self.options.directory_selection)
          return false;

        if(!(self.options.multiple_selection && e.shiftKey))
          self.element.find(".selected").removeClass("selected");

        item.addClass("selected");
        return false;
      }
    }

    //THIS IS GONE FOR REFACTOR
    //This method will take a column id and collapse all folder after it while updating the file path input field to be correct.
    //function toggle_all_folders_after_column(column_id, slide_boolean){
    //  visible_column_ids = $(".file-browser:visible").map(function(){return parseInt(this.id);}).sort();
    //  max = visible_column_ids[visible_column_ids.length-1];
    //  for(var i = (column_id+1); i <= max; i++){
    //    $(".file-browser#"+i).remove();
    //    visible_column_ids = $(".file-browser:visible").map(function(){return parseInt(this.id);}).sort();
    //    if(slide_boolean){
    //      column_to_show = visible_column_ids[0] - 1;
    //      $(".file-browser#"+column_to_show).show();
    //    }
    //  }
    //  new_value = $(".path-entry-input").val().split("/").splice(0,column_id-1).join("/")+"/";
    //  //Undo the autocomplete hiding of rows.
    //  $(".file-browser#"+column_id).find("tr").show();
    //  $(".path-entry-input").val(new_value);
    //}

    //THIS IS GONE FOR REFACTOR
    //Watch what they type into the file path input field and click, or unclick folders based on it.
    //$(".path-entry-input").keypress(function(event){
    //  if(event.which == 47){
    //    folder_array = $(this).val().split("/");
    //    latest_folder = folder_array[folder_array.length-1];
    //    //Click the folder
    //    input_with_text = true;
    //    $("tr#"+latest_folder.replace(".","dot")).find(".arrow").click();
    //  }else if (event.which == 8){
    //    //Backspace was pressed
    //    folder_array = $(this).val().split("/");
    //    latest_folder = folder_array[folder_array.length-1];
    //    if (latest_folder == ""){
    //      path_to_add = folder_array[folder_array.length-2];
    //      column = folder_array.length-1;
    //      toggle_all_folders_after_column(column, true);
    //      previous_dir = $(".file-browser#"+column).find(".directory.open");
    //      previous_dir.removeClass("open");
    //      //Random character appended so that the backspace will take effect on it. Hacky? Yes. Future fix desired.
    //      $(this).val($(this).val()+path_to_add+"r");
    //    }
    //  }
    //});

    //THIS IS GONE FOR REFACTOR
    //This is where the autocomplete happens.
    //$(".path-entry-input").keyup(function(event){
    //  column_id = $(this).val().split("/").length-1;
    //  $(".file-browser#"+(column_id+1)).find('tr').hide();
    //  matches = $(".file-browser#"+(column_id+1)).find('tr:regex(id,^'+$(this).val().replace(".","dot").split("/").splice(column_id,1).join("/")+')').show();
    //});

    function toggle_directory(self)
    {
      return function()
      {
          //If the folder we are expanding is the host, we want to prepend a / to the path input box.
          if ($(this).hasClass("host")){
            $(".path-entry-input").val("/")
          }
          $(this).addClass("open");

          //This call gets the files and folders in the toggled/opened directory.
          $.ajax(
          {
            context : this,
            processData : false,
            data : $.toJSON({}),
            type : "POST",
            url : self.options.server_root + "remotes/" + self.options.session + "/browse" + $(this).data("path"),
            contentType : "application/json",
            success : function(result)
            {

              var path = $(this).data("path");
              var container = $(".file-browser");

              //remove all previous folders and directories so that we are "moving" to the new folder.
              $(".file-browser").find("tr.directory").remove();          
              $(".file-browser").find("tr.file").remove();          

              //This will add a folder that a user can click on to go up a directory
              if (path != "/"){
                var item = $("<tr>").attr("id","up_dir").attr("class","up").appendTo(container);
                var entry = $("<div/>").appendTo(item);
                var icon = $("<span class='icon'></span>").appendTo(entry);
                var label = $("<span class='label'></span>").text("..").appendTo(entry);
                item_path = path.replace(/\/\.?\w*\/?$/, "");
                if (item_path == ""){
                  item_path += "/"
                }
                item.data("path", item_path);
                item.bind("toggle-directory", toggle_directory(self));
                entry.click(select_item(self, item));
                item.addClass("directory");
                entry.click(click_directory(item));
              }
              //Iterate over all results from ajax call and append them to the container. This is all files and folders in current directory.
              for(var i = 0; i != result.names.length; ++i)
              {
                name = result.names[i];
                size = result.sizes[i];
                type = result.types[i];

                var item = $("<tr>").attr("id",name.replace(".","dot")).appendTo(container);
                var entry = $("<div/>").appendTo(item);
                var icon = $("<span class='icon'></span>").appendTo(entry);
                var label = $("<span class='label'></span>").text(name).appendTo(entry);

                item.data("path", path.replace(/\/$/, "") + "/" + name);
                item.bind("toggle-directory", toggle_directory(self));

                entry.click(select_item(self, item));

                if(type == "d")
                {
                  item.addClass("directory");
                  entry.click(click_directory(item));
                }
                else if(type == "f")
                {
                  item.addClass("file");
                }

                if(name.charAt(0) == ".")
                {
                  item.addClass("dotfile");
                  if(self.options.hide_dotfiles)
                    item.addClass("hidden");
                }
              }
            },
            statusCode :
            {
              404 : function()
              {
                alert("The remote session timed-out.");
              },

              400 : function()
              {
                $(this).removeClass("open");
                $(this).addClass("forbidden");
                alert("The folder " + $(this).data("path") + " can't be opened, probably because you don't have permission to see its contents.");
              }
            }
          });
        //}

        return false;
      }
    }

    var container1 = $("<table>").addClass("file-browser").attr("id","1").appendTo(self.element.empty());
    var input_with_text = false;
    var item = $("<tr>").appendTo(container1);
    var entry = $("<div/>").appendTo(item);
    var label = $("<span class='label'></span>").text("Host: " + self.options.root_label).appendTo(entry);

    entry.click(click_directory(item));
    item.data("path", self.options.root_path);
    item.bind("toggle-directory", toggle_directory(self));
    item.addClass("host");
    item.trigger("toggle-directory");
  },

  _setOption: function(key, value)
  {
    this.options[key] = value;

    if(key == "hide_dotfiles")
    {
      this.element.find(".dotfile").toggleClass("hidden", value);
    }
  },

  show_all: function()
  {
    this.element.find(".hidden").removeClass("hidden");
  },

  selection: function()
  {
    return this.element.find(".selected").map(function() { return $(this).data("path"); }).get();
  },
});


