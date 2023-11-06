var CONFIG = {
  "svgs": [
    {id: "#storyline", name: "timeline", margin: {top: 0, right: 80, bottom: 0, left: 80}},
    {id: "#scatterplot", name: "scatterplot", margin: { top: 20, right: 10, bottom: 10, left: 20 } },
  ],
  "margin": {top: 15, right: 20, bottom: 20, left: 150},
  "default_color": "grey",
  "highlight_color1": "#2196F3",
  "highlight_color2": "#EE4B2B",
  "description": {
    'presence': "This feature shows the number of mentions for each character in the story." +
      " The characters are shown on the vertical axis whereas the chapters are shown in the horizontal axis." +
      " The  visualization defaults to a single chapter if the story is short or has no explicit chapters." +
      " The length of a tile shows how long a chapter is. The color of tiles show number of mentions for a character."+
      " The brighter the color, the higher the presence of the character."+
      " Take your mouse over a tile to see the character highlighted. Click on a tile to investigate the chapter more deeply"+
      " The text on the right is linked to the tiles.",
    'sentiment': "This feature shows sentiments for each character in the story." +
      " The characters are shown on the vertical axis whereas the chapters are shown in the horizontal axis." +
      " The  visualization defaults to a single chapter if the story is short or has no explicit chapters." +
      " The length of a tile shows how long a chapter is. The color of tiles show average sentiment for a character in a chapter." +
      " Take your mouse over a tile to see the character highlighted. Click on a tile to investigate the chapter more deeply" +
      " On click, the visualization shows sentiment for each sentence of the selected chapter." +
      " Try out the smooth checkbox to see commulative change of sentiment for the characters.", 
    'emotion': "This feature shows emotions for each character in the story." +
      " The characters are shown on the vertical axis whereas the chapters are shown in the horizontal axis." +
      " The  visualization defaults to a single chapter if the story is short or has no explicit chapters." +
      " The length of a tile shows how long a chapter is. The color of tiles show prominent emotion for a character in a chapter." +
      " Take your mouse over a tile to see the character highlighted. Click on a tile to investigate the chapter more deeply" +
      " On click, the visualization shows emotion for each sentence of the selected chapter.",
    'direct_discourse': "This feature shows the number of direct discourse for each character in the story." +
      " The characters are shown on the vertical axis whereas the chapters are shown in the horizontal axis." +
      " The  visualization defaults to a single chapter if the story is short or has no explicit chapters." +
      " The length of a tile shows how long a chapter is. The color of tiles show number of direct discourse for a character." +
      " The brighter the color, the higher the number of direct discourse for the character." +
      " Take your mouse over a tile to see the character highlighted. Click on a tile to investigate the chapter more deeply" +
      " The text on the right is linked to the tiles.", 
    'adjective': "This feature shows the adjectives used for each character in the story.",
    'change_in_action': "This feature shows the changes of actions for each character in the story." +
      " The characters are shown on the vertical axis whereas the chapters are shown in the horizontal axis." +
      " The length of a tile shows how long a chapter is. The color of tiles show how different " +
      "the actions are for the character in a chapter compared to the previous chapter." +
      " The brighter the color, the higher the change." +
      " Take your mouse over a tile to see the character highlighted. Click on a tile to see the actions for a chapter and its previous chapter" +
      " The text on the right is linked to the tiles.",
    'tag': "We show the important places and times of the story in this view." +
    " The horizontal axis represents the length of the story."
  }
}
