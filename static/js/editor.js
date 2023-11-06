class Editor {
  /* Constructor for the class */
  constructor () {
    this.sentence_limits = [];
    this.active_sentence_limits = [];
    this.left = 0;
    this.right = 0;
    this.step_size = 0;
    this.entities = {}
    this.stopwords = [".", "?", "!"];
    this.entities = {};
    this.colors = ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'];
    this.entity_colors = {};
    this.quill = new Quill('#editor', {
      modules: {
        toolbar: [
          [{ 'font': [] }],
          [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
          ['bold', 'italic', 'underline'],
          ['image', 'code-block']
        ]
      },
      scrollingContainer: '#scrolling-container',
      placeholder: 'Write your story here...',
      theme: 'snow'  // or 'bubble'
    });
    this.change = new Delta();
    this.quill.setText(doc)
    this.install_events(this.quill);
  }

  /* getter, setter functions for class variables */
  get_entities(){
    return this.entities;
  }
  set_entities(entities, unique_chars){
    this.entities = entities;
    this.entity_colors = 
      d3.scaleOrdinal(d3.schemeDark2)
        .domain(unique_chars);

  }
  set_sentence_limits(sentence_limits) {
    this.sentence_limits = sentence_limits;
  }
  get_sentence_limits() {
    return this.sentence_limits;
  }
  set_active_sentence_limits(sentence_limits) {
    this.active_sentence_limits = sentence_limits;
  }
  get_active_sentence_limits() {
    return this.active_sentence_limits;
  }
  set_step_size(step_size) {
    this.step_size = step_size;
  }
  get_step_size(){
    return this.step_size;
  }

  /* Text highlighting */
  remove_hightlight (){
    this.quill.setSelection(this.left, 0);
    this.quill.removeFormat(0, this.quill.getLength());
  }

  /* Highlight entities on interaction with the timeline */
  highlight_entities(left, right, character, remove_prev_highligth = true){
    var self = this;
    // console.log(VIZ.data['characters_map'][character])
    VIZ.data['characters_map'][character].forEach(function(c,i){ 
      if( (c[0] >= left ) && (c[0] <= right) ) {
        self.quill.formatText(c[0], c[1] - c[0], {
          'bold': true,
          'background': "lightblue"
        });
      }  
    })  
  }
  highlight_sentence(part, chapter, character, remove_prev_highligth=true) {
    if(remove_prev_highligth) this.remove_hightlight();

    this.left = VIZ.data['chapters_mapping'][part]['chapters'][chapter]['start_char'];
    this.right = VIZ.data['chapters_mapping'][part]['chapters'][chapter]['end_char'];
    
    this.quill.setSelection(this.left, this.right - this.left);
    this.quill.setSelection(this.left, 0)
    this.highlight_entities(this.left, this.right, character); 
  }

  /* Highlight coreference cluster */
  highlight_cluster(cluster, remove_prev_highligth = true) {
    var self = this;

    if (remove_prev_highligth) this.remove_hightlight();

    var cluster_length = cluster.length;
    if (cluster_length) {
      this.left = cluster[0][0]; // start of the first span
      this.right = cluster[cluster_length - 1][1] // end of last span

      // this.quill.setSelection(this.left, this.right - this.left);
      // this.quill.setSelection(this.left, 0)
      var bounds = this.quill.getBounds(this.left, this.right - this.left);
      ED.quill.scrollingContainer.scrollTop = bounds.top;
      cluster.forEach(function (c, j) {
        self.quill.formatText(c[0], 
          c[1] - c[0], {
          'bold': true,
          'background': "#728FCE"
        }); 
      })
    }  
  }

  /* wordcount */
  update_wordcount(text){
    let len = text.split(" ").length;
    $("#wordcount").html(len)
  }
  
  /* Interactions */
  install_events (quill) {
    var self = this;
    // quill.on('text-change', function(delta, oldDelta, source) {
    //   if (source == 'user') {
    //     logs.push({type:'text change'})
    //     self.change = self.change.compose(delta);
    //     // console.log(delta)
    //     self.update_wordcount(quill.getText())
    //     delta['ops'].forEach((op, i) => {
    //       if ('insert' in op)
    //         if (self.stopwords.indexOf(op['insert']) != -1)
    //           update(quill.getText()) // from index.js
    //     });
    //   }
    // });

    quill.on('selection-change', function (range, oldRange, source) {
      if (range) {
        if (range.length == 0) {
          // console.log('User cursor is on', range.index);
        } else {
          var text = quill.getText(range.index, range.length);
          console.log('User has highlighted', text)
          console.log("highlighted range", range.index, range.index + range.length);
        }
      } else {
        // console.log('Cursor not in the editor');
      }
    });

    // Check for unsaved data
    // window.onbeforeunload = function() {
    //   if (change.length() > 0) {
    //     return 'There are unsaved changes. Are you sure you want to leave?';
    //   }
    // }
  }
}
