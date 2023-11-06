class Viz {

  /* CONSTRUCTOR */
  constructor(data) {
    this.data = data;
    this.binned_data = [];
    this.pairs = [];
    this.words = {};
    this.svgs = {};
    this.selected = [];
    this.selected_labels = [];
    this.aggregate = 1
    this.edges = [];
    this.char_mapping = {}
    this.cards = {}
    this.isClicked = false
    this.populate_characters_dropdown(this.data['characters']);
    this.populate_chapters(this.data['chapters_map'])
    $("#update_storyline").removeClass("disabled")
    // this.install_events();
  }

  /* HTML CODES */
  populate_characters_dropdown(characters){
    $("#character_list").empty()
    $("#character_list").append('<option value="all">All</option>')
    characters.forEach(function(ch, i){
      $("#character_list").append('<option value="'+ch+'">'+ch+'</option>')
    })
    $('#character_list').dropdown({});
    // $('#character_list').val("all")
  }
  populate_chapters(data){
    $("#chapter_list").empty()
    $("#chapter_list").append('<option value="all">All</option>')
    data[0].chapters.forEach(function (ch, i) {
      if( (name == "the_quest_of_the_silver_fleece") && (i >= 17))
        return;
      $("#chapter_list").append('<option value="' + (i) + '">' + (i+1) + '</option>')
    })
    $('#chapter_list').dropdown({ maxSelections : 2});
  }

  show_active_chapter_character(chapter, character, show_character = false) {
    this.remove_active_chapter_character() 
    $("#active_chapter").append("Chapter " + (chapter + 1))
    if (show_character) {
      $("#active_divider").append("/")
      $("#active_character").append(character)
    }
    $("#details").removeClass("deactive")
    $(".ui.deselect.button").show()
  }
  remove_active_chapter_character() {
    $("#active_chapter").html("")

    $("#active_divider").html("")
    $("#active_character").html("")

    $("#details").addClass("deactive")
    $(".ui.deselect.button").hide()
  }

  update_timeline_feature_wise(){
    var self = this;
    // get selected features and characters
    var features = $('#feature_list').dropdown("get values")
    var selected_characters = $('#character_list').dropdown("get values")
    // self.preselected_chapters = $('#chapter_list').dropdown("get values")

    // //check the chapter length
    // if (self.preselected_chapters.length > 2){
    //   alert("You can select at most 2 chapters. Sorry!")
    //   return
    // }

    // iterate the features and visualize
    if ((!features.length) || (features.indexOf('all') != -1))
      features = ['presence', 'sentiment', 'emotion', 'direct_discourse', 'adjective', 'actions_only', 'change_in_action']

    var div_height = $("#storyline").height()
    var height = (div_height - 100 )/features.length 
    
    if (show_context)
      features = ['tag'].concat(features)

    $(".ui.card").remove()
    self.cards = {}
    $("#storyline").empty()

    self.vertical = d3.select("#storyline")
      .append("div")
      .attr("class", "remove")
      .style("position", "absolute")
      .style("z-index", "19")
      .style("width", "1px")
      .style("height", $("#storyline").height * 1.2)
      .style("top", "50px")
      .style("bottom", "30px")
      .style("left", "100px")
      .style("background", "grey")
      .style("visibility", "hidden");

    self.isClicked = false;
    self.remove_active_chapter_character()
    
    features.forEach(function (feat, i) {
      var div_id = 'feat_'+feat
      $("#storyline").append('<div id="'+div_id+'" class="col-lg-12"></div>')
      if (feat == "presence")
        self.cards[feat] = new Presence(feat, self.data, "sentiment_emotion_data", selected_characters, div_id, height, CONFIG['description'][feat])
  
      else if (feat == "sentiment")
        self.cards[feat] = new Sentiment(feat, self.data, "sentiment_emotion_data", selected_characters, div_id, height, CONFIG['description'][feat])

      else if (feat == "emotion")
        self.cards[feat] = new Emotion(feat, self.data, "sentiment_emotion_data", selected_characters, div_id, height, CONFIG['description'][feat])
        
      else if (feat == "direct_discourse")
        self.cards[feat] = new Discourse(feat, self.data, "direct_discourse_data", selected_characters, div_id, height, CONFIG['description'][feat])

      else if ( (feat == "actions_only") && ("actions_only" in self.data))
        self.cards[feat] = new Actions_only(feat, self.data, "actions_only", selected_characters, div_id, height, CONFIG['description'][feat])
      
      else if (feat == "change_in_action")
        self.cards[feat] = new Action(feat, self.data, "actions", selected_characters, div_id, height, CONFIG['description'][feat])

      else if (feat == "adjective")
        self.cards[feat] = new Adjective(feat, self.data, "adjective_data", selected_characters, div_id, height, CONFIG['description'][feat])
      
      else if (feat == "tag")
        self.cards[feat] = new Context(feat, self.data, "tags_presence", selected_characters, div_id, 80, CONFIG['description'][feat])
    })

    self.install_events()

  }

  update_timeline(aggregate_option="feature_wise"){
    var self = this
    if (aggregate_option == "feature_wise") {
      self.update_timeline_feature_wise()
    }
    else{
      self.update_timeline_character_wise()
    }

    // self.install_events()   
  }

  /* INTERACTIONS */
  //click event
  install_events () {
    var self = this;
    d3.selectAll("svg").on("click", function (event, d) {
      event = event.target

      // click a feature unit
      if ($(event).hasClass("features_unit")) {
        d = d3.select(event).datum()
        // console.log(d)
        if (!self.isClicked) {
          self.isClicked = true
          $(".ui.deselect.button").show()
          VIZ.show_active_chapter_character(d.chapter, d.character)
          if (!$(event).hasClass("change_in_action_bar")){
            for (var k in self.cards) {
              var card = self.cards[k]
              if (k != "change_in_action") {
                card.selected_chapter = card.data['chapters_map'][d.part]['chapters'][d.chapter]
                card.chapter = d.chapter
                card.part = d.part
                card.selected_data = card.data_prep(card.data[card.data_key], card.feat_name, d.part, d.chapter, card.selected_characters)
                // console.log(card.selected_chapter, d.chapter)
                card.chart.update(card.selected_data, [card.selected_chapter.start_char, card.selected_chapter.end_char])
              }
            }
          }
        }
      }
      // click on a word in the wordzone view
      else if ($(event).hasClass("word")) {
        d = d3.select(event).datum()
        if (self.cards[d.card].selected_mentions.length > 1)
          self.cards[d.card].isClicked = true
      }
    })
    d3.selectAll("svg").on("mouseover", function (event, d) {
      var mousex = d3.pointer(event);
      event = event.target

      // hover over a feature unit
      if ($(event).hasClass("features_unit")) {
        mousex = mousex[0] + 30;
        self.vertical.style("left", mousex + "px").style("visibility", "visible")

        d = d3.select(event).datum()
        VIZ.show_active_chapter_character(d.chapter, d.character, true)
        if (!self.isClicked) {

          // highlight the bars
          d3.selectAll(".features_unit")
            .filter((a, i) => (d.part == a.part) && (d.chapter == a.chapter))
            .attr("stroke", "orange")
            .attr("stroke-width", 1.5)

          // need to have different color for the selected character
          d3.selectAll(".features_unit")
            .filter((a, i) => (d.character == a.character) && (d.part == a.part) && (d.chapter == a.chapter))
            .attr("stroke", "red")

          // now highlight the labels
          var sel_chars = d3.selectAll(".features_unit").data()
            .filter((a, i) => (d.part == a.part) && (d.chapter == a.chapter))
            .map(a => a.character)

          d3.selectAll(".y_axis_label")
            .filter((a, i) => sel_chars.indexOf(a) != -1)
            .attr("fill", "orange")

          // again need to have different color for the selected character
          d3.selectAll(".y_axis_label")
            .filter((a, i) =>  a == d.character)
            .attr("fill", "red")

          // for showing the actions
          if ($(event).hasClass("change_in_action_bar")) {
                self.cards['change_in_action'].list_frames(d.part, d.chapter, d.character)
            }
        }
        else{
          // when there is a sent_id is present
          if ("global_sent_id" in d) {
            d3.selectAll(".features_unit")
              .filter((a, i) => (d.global_sent_id == a.global_sent_id))
              .attr("stroke", "orange")
              .attr("stroke-width", 1.5)

            d3.selectAll(".features_unit")
              .filter((a, i) => (d.character == a.character) && (d.global_sent_id == a.global_sent_id))
              .attr("stroke", "red")

            // now highlight the labels
            var sel_chars = d3.selectAll(".features_unit").data()
              .filter((a, i) => (d.global_sent_id == a.global_sent_id))
              .map(a => a.character)

            d3.selectAll(".y_axis_label")
              .filter((a, i) => sel_chars.indexOf(a) != -1)
              .attr("fill", "orange")

            // again need to have different color for the selected character
            d3.selectAll(".y_axis_label")
              .filter((a, i) => a == d.character)
              .attr("fill", "red")

            self.data['sentence_mapping'][d.global_sent_id]['mentions'].forEach(function (c, i) {
              if (c.character == d.character)
                ED.quill.formatText(c.start_char, c.end_char - c.start_char, {
                  'bold': true,
                  'background': "lightblue"
                });
            })
          }
          // for discourse highlighting. these are not sentences
          else{
            d3.select(event)
              .attr("stroke", "red")
              .attr("stroke-width", 1.5)

            if("mention_start" in d){
              ED.quill.formatText(d.mention_start, d.mention_end - d.mention_start, {
                'bold': true,
                'background': "lightblue"
              });
            }
          }
          // highlight selected sentence/passage
          ED.quill.formatText(d.start_char, d.end_char - d.start_char, {
            'bold': true
          });
        }
        // highlight the mentions
        var bounds = ED.quill.getBounds(d.start_char, d.end_char - d.start_char);
        ED.quill.scrollingContainer.scrollTop = bounds.top;    
      }

      // hovering over a character in the adjective view
      else if($(event).hasClass("word_character_label")) {
        var card = d3.select(event).attr("card")
        d = d3.select(event).datum()
        var norm_data = self.cards[card].select_words(d)
        self.cards[card].wordzone(norm_data)
        // console.log(d)
      }

      // hovering over a word in the adjective view
      else if ($(event).hasClass("word")) {
        d = d3.select(event).datum()
        if (!self.cards[d.card].isClicked){
          if (d.entries.length){
            self.cards[d.card].selected_mentions = d.entries
            self.cards[d.card].i = 0
            self.cards[d.card].highlight_word()

            if(d.entries.length > 1){
              $("#prev_word").show()
              $("#next_word").show()
              $("#remove_word").show()
            }
          }
        }
      }
    })
    
    // mouseout event
    d3.selectAll("svg").on("mouseout", function (event, d) {
      // hide the vertical line
      self.vertical.style("visibility", "hidden")

      event = event.target

      // if the highlight was on a feature unit, reset selection
      if ($(event).hasClass("features_unit")) {
        d = d3.select(event).datum()
        for (var k in self.cards) {
          var card = self.cards[k]
          d3.selectAll("."+card.feat_name+"_bar")
            .attr("stroke", "black")
            .attr("stroke-width", card.stroke)
        }
        d3.selectAll(".y_axis_label")
          .attr("fill", "currentColor")
          
        VIZ.remove_active_chapter_character()
        ED.quill.removeFormat(0, ED.quill.getLength());
        if (self.isClicked)
          VIZ.show_active_chapter_character(d.chapter, d.character)

        if ($(event).hasClass("change_in_action_bar")) {
          if(!self.isClicked)
            $("#frames").hide()
        }
      }

      // if the highlight was on a word
      else if ($(event).hasClass("word")) {
        d = d3.select(event).datum()
        if(!self.cards[d.card].isClicked) {
          $("#prev_word").hide()
          $("#next_word").hide()
          $("#remove_word").hide()
          self.cards[d.card].remove_highlight()
          self.cards[d.card].selected_mentions = []
          // ED.quill.removeFormat(0, ED.quill.getText().length)
        }
      }
    })

    // reset chapter highlight
    $(".ui.deselect.button").on("click", function () {
      self.isClicked = false
      for(var k in self.cards){
        var card = self.cards[k]
        card.selected_data = card.data_prep(card.data[card.data_key], card.feat_name, false, -1, card.selected_characters)
        card.chart.update(card.selected_data, card.svg.x.domain())
        $(".ui.deselect.button").hide()
        
      }
      self.remove_active_chapter_character()
      $("#frames").hide()  
    })
  }
}
