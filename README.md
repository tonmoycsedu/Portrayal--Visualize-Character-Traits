# Welcome to Portrayal.

This is the accompanying codebase for the following paper: 
**Md Naimul Hoque, Bhavya Ghai, Kari Kraus, Niklas Elmqvist. PORTRAYAL: Leveraging NLP and Visualization for Analyzing Fictional Characters. Proceedings of the ACM Conference on Designing Interactive Systems (DIS), ACM, New York, NY, USA, 2023.**

Read the paper here: https://naimulh0que.github.io/docs/dis23-42.pdf

See a demo of the tool here: https://t.co/wRu0g9Zas7

Try out the tool here: https://character-traits.herokuapp.com/home

The current implementation is written with in Vanilla JS with a Python Flask Server.

1. To get started please install the python packages requirements.txt: pip install -r requirements.txt
2. Open a terminal in the repository directory.
3. Run the following command: python app.py
4. Go to http://127.0.0.1:5000/home and start by analyzing one of the four preloaded stories in the system.

Uploading a new story is a little bit inconvenient right now. We preprocess a story by extracting the character traits using NLP techniques.
To use the NLP pipeline, please refer to the https://github.com/tonmoycsedu/Portrayal--Visualize-Character-Traits/blob/main/notebooks/narrative_arc-chapter_wise.ipynb notebook.

The code reads a txt file from ../static/data/story/*name_of_the_story*/*name_of_the_story.txt* and runs a coreference resolution model to detect the characters from the text.

We only run the coref model on each chapter to keep the named clusters consistent and error free. 
We then used an interface to name the clusters and merge same named clusters across different chapters.
You can find the interface when you go to the main editor from http://127.0.0.1:5000/home and toggle the **Annotate Story** button.
Once finish with the annotation part, click the **Save Annotation** button and go back to the notebook.

The other parts of the notebook should now run smoothly. You can visualize the story using Portrayal now.

