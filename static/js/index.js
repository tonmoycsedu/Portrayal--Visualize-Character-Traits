
/* Define global variables and class accessor */
var ED, VIZ, CHARACTER, AN;
var tooltip;
var Delta = Quill.import('delta');
var data;
var show_context=1;
$("#frames").hide()

/* on document ready, initialize */
$( document ).ready(function() {
  ED = new Editor();
  $('#feature_list').dropdown({});
  $('#character_list').dropdown({});
  $('#chapter_list').dropdown({});
  $('#part_list').dropdown({});
  $('#chapter_list').dropdown({ maxSelections : 2});
  show_vis_div() 
});

/* Toggle between annotation and visualization */
function show_vis_div(){
  $("#vis_div").show()
  $("#annotate_div").hide()
  if(!VIZ)
    get_data()
}
function show_annotate_div() {
  $("#vis_div").hide()
  $("#annotate_div").show()
}
$("#visualize_toggle").on("click", function(){
  $("#annotate_toggle").prop("checked", !$("#annotate_toggle").prop('checked'))
  if ($(this).prop('checked')) show_vis_div()
  else show_annotate_div()

})
$("#annotate_toggle").on("click", function () {
  $("#visualize_toggle").prop("checked", !$("#visualize_toggle").prop('checked'))
  if ($(this).prop('checked')) show_annotate_div()
  else show_vis_div()

})

$("#show_context").on("click", function () {
  if ($(this).prop('checked')) show_context = 1
  else show_context = 0

})

/* Visualize narrative arc */
function convert_scale(data) {
  data.forEach(d => {
    d.sentiment = (d.sentiment * 2) - 1
  })
  return data
}

function get_data(){
  $.ajax({
    url: '/get_data',
    data: JSON.stringify({ name: name }),
    type: 'POST',
    success: function (res) {
      data = res.data;
      console.log(data)
      data['sentiment_emotion_data'] = convert_scale(data['sentiment_emotion_data'])
      VIZ = new Viz(data);
      // VIZ.update_timeline()
    },
    error: function (error) {
      console.log("error !!!!");
    }
  });
}
$("#update_storyline").on("click", function () { 
  VIZ.update_timeline()  
   
});

/* initialize coref annotation */
$("#start_annotation").on("click", function(){
  console.log("requesting coref resolution")
  $.ajax({
    url: '/get_coref_clusters',
    data: JSON.stringify({ 
      // num_parts: $("#parts").val(),
      // parts_regex: $("#parts_regex").val(),
      // chapters_regex: $("#chapters_regex").val(),
      name: name 
    }),
    type: 'POST',
    success: function (res) {
      console.log(res)
      AN = new Annotation(res['coref_clusters'])
    },
    error: function (error) {
      console.log("error !!!!");
    }
  });
})

$("#load_data").on("click", function () {
  console.log("requesting annotated data")
  $.ajax({
    url: '/get_annotated_data',
    data: JSON.stringify({
      name: name
    }),
    type: 'POST',
    success: function (res) {
      console.log(res)
      AN.annotated_data = res['coref_clusters']
    },
    error: function (error) {
      console.log("error !!!!");
    }
  });
})


