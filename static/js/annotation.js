class Annotation {

    /* CONSTRUCTOR */
    constructor(data, words_index = false) {
        this.data = data;
        this.words_index = words_index;
        this.annotated_data = {};
        this.initilize_part_dropdown()
        this.install_events();
    }
    /* Populate dropdowns */
    initilize_part_dropdown() {
        var self = this;
        $('#part_list').empty()
        $("#part_list").append('<option value="none">---Select Part---</option>')
        for (var i = 0; i < self.data.length; i++) {
            $('#part_list').append('<option value="' + i + '">' + i + '</option>')
        }
        $('#part_list').dropdown({});
    }
    update_chapter_dropdown(p){
        var self = this;
        $('#chapter_list').empty()
        $("#chapter_list").append('<option value="none">---Select Chapter---</option>')
        $("#chapter_list").append('<option value="all">All</option>')
        for (var i = 0; i < self.data[p]['chapters'].length; i++) {
            $('#chapter_list').append('<option value="' + i + '">' + i + '</option>')
        }
        $('#chapter_list').dropdown({});
    }
    /* show all the cluster of a segment */
    show_coref_clusters(p, ch) {
        var self = this;
        $("#current_chapter").empty()
        var thres = parseInt($("#coref_threshold").val())

        self.data[p]['chapters'].forEach(function(chapter, cid){
            chapter['clusters'].forEach(function(c, i){
                if( (ch == "all") || (ch == cid) ){
                    if (c.length > thres) {
                        // console.log(c.length)
                        var html_string = '<div>'

                        html_string += '<div class="ui lightgrey large horizontal label cluster_label"' +
                            ' cluster="' + i + '" part="' + p + '" chapter="' + cid + '">' +
                            'Cluster ' + i +
                            '<i class="character delete icon"></i>' +
                            '</div>';

                        html_string += c.length + ' mentions'
                        html_string += '<button class="ui mini basic icon button add_button"' +
                            ' cluster="' + i + '" part="' + p + '" chapter="' + cid + '">' +
                            '<i class="add icon"></i>' +
                            '</button>'

                        html_string += '</div>';

                        $("#current_chapter").append(html_string)
                    }
                }
                
            })   
        })
        // this.install_events();
    }
    add_new_main_cluster(cluster, p, ch) {
        var self = this;
        var cluster_id = p + '_' + ch + '_' + cluster;
        var cluster_name = ' part = "' + p + '" chapter = "' + ch + '" cluster = "' + cluster
        console.log(cluster_id, self.annotated_data)

        if (cluster_id in self.annotated_data) {
            alert("Cluster already added!")
            return
        }
        var sel_data = self.data[p]['chapters'][ch]['clusters'][cluster]
        self.annotated_data[cluster_id] = { "data": sel_data, "alias": [], "name": cluster_name, "type": "character"}

        var html_string = '<div class="character_div" id="' + cluster_id +'"> <span>'
        html_string += '<div class="ui small label" style="margin-right:5px">' +
            cluster_name + '" </div></span>';

        html_string += 
            '<div class="ui input mini">' +
                '<input class="character_name" type = "text" placeholder = "Name" >'+
                '<i class="close icon"></i>'+
            '</div>';

        html_string += '<select class="type_dropdowns">' +
            '<option value="character">Character</option>' +
            '<option value="tag">Tag</option></select>'

        html_string += '<select class="merge_dropdowns"></select>'
        html_string += '</div>'
        
        $("#all_chapter").append(html_string)

        // reset the merge dropdowns
        $(".merge_dropdowns").empty()
        $(".merge_dropdowns").append("<option>Merge</option")
        for (var c in self.annotated_data){
            var name = self.annotated_data[c]['name']
            var idx = c.split("_")
            $(".merge_dropdowns").append('<option value="'+idx[0]+ '_'+ idx[1] + '_' + idx[2] + '">' + 
                name + '</option>')
        }
        // self.install_events();
        
    }
    /* Interactions */
    install_events() {
        var self = this;
        var tag_clicked = 0;
        $('#part_list').on("change", function(){
            var part = $('#part_list').val()
            self.update_chapter_dropdown(part)
        })
        $('#chapter_list').on("change", function () {
            var part = $('#part_list').val()
            var chapter = $('#chapter_list').val()
            self.show_coref_clusters(part, chapter)
        })
        $("body").on("click", ".cluster_label", function(){
            tag_clicked = 1 - tag_clicked
        })
        $("body").on("mouseover", ".cluster_label", function(){
            if(!tag_clicked) {
                var cluster = parseInt($(this).attr("cluster"))
                var part = parseInt($(this).attr("part"))
                var chapter = parseInt($(this).attr("chapter"))
                $(this).removeClass("lightgrey")
                $(this).addClass("blue")
                // console.log(cluster, segment, self.data[segment]['clusters'][cluster])
                ED.highlight_cluster(self.data[part]['chapters'][chapter]['clusters'][cluster])
            }   
        })
        $("body").on("mouseout", ".cluster_label", function () {
            if (!tag_clicked) {
                $(this).removeClass("blue")
                $(this).addClass("lightgrey")
                ED.remove_hightlight();
            }
        })
        $("body").on("click", ".add_button", function(){
            var cluster = parseInt($(this).attr("cluster"))
            var part = parseInt($(this).attr("part"))
            var chapter = parseInt($(this).attr("chapter"))
            self.add_new_main_cluster(cluster, part, chapter)
        })
        $("body").on("change", ".character_name", function(){
            var value = $(this).val()
            var div = $(this).closest(".character_div");
            var cluster_id = div.attr("id")

            if (cluster_id in self.annotated_data)
                self.annotated_data[cluster_id]['name'] = value

        })
        $("body").on("change", ".merge_dropdowns", function(){
            var value = $(this).val()
            var div = $(this).closest(".character_div");
            var cluster_id = div.attr("id")
            console.log(cluster_id, value)

            if (value == cluster_id) {
                alert("Can not merge the cluster with its own cluster! Select another cluster")
                return;
            }
            var c = confirm("Proceed with the merge?")
            if(c){
                var alias_data = self.annotated_data[cluster_id]
                var main_data = self.annotated_data[value]
                main_data['alias'].push(cluster_id)
                main_data['data'] = main_data['data'].concat(alias_data['data'])

                delete self.annotated_data[cluster_id];
                div.remove();

                // add the new label
                var span = $("#"+value).children("span");
                var idx = cluster_id.split("_")
                var html_string = '<div class="ui small label" style="margin-right:5px">' + alias_data['name']+ '</div>'
                span.append(html_string)
            }

        })
        $("body").on("change", ".type_dropdowns", function () {
            var value = $(this).val()
            var div = $(this).closest(".character_div");
            var cluster_id = div.attr("id")

            var cluster_data = self.annotated_data[cluster_id]
            cluster_data['type'] = value
            console.log(self.annotated_data)
        })
        $("#save_annotation").on("click", function(){
            var c = confirm("Save the annotated data?")
            if(c) {
                $.ajax({
                    url: '/save_annotated_data',
                    data: JSON.stringify({ data: self.annotated_data, name: name }),
                    type: 'POST',
                    success: function (res) {
                        console.log(res)
                    },
                    error: function (error) {
                        console.log("error !!!!");
                    }
                });
            }

        })  
    }
}