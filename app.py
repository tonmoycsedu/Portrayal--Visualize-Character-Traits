from flask import Flask, render_template, url_for, request, jsonify, flash,redirect, session
from flask_pymongo import PyMongo
import pandas as pd
import numpy as np
# import spacy
# import en_core_web_sm
# from spacy.symbols import nsubj, VERB, amod, acomp
# import neuralcoref
import re
import os
# from forms import RegistrationForm,LoginForm
import socket

import itertools
# from gensim.models import KeyedVectors
from scipy.spatial.distance import cosine 
from numpy.linalg import norm
#from sklearn.decomposition import PCA
import json
import random
from analysis import *

NLP = Analysis()
# nlp = en_core_web_sm.load()
# neuralcoref.add_to_pipe(nlp)
# from io import StringIO

app = Flask(__name__)

## ----------------------- UI routes ------------------------
@app.route("/")   ###default route, home page
def welcome():
    return render_template("welcome.html")

@app.route("/home")
def home():
    # if 'email' in session:
    project_names = []
    files = os.listdir("./static/data/story/")
    files = [file.split(".")[0] for file in files]

    return render_template("home.html", project_names = project_names, sample_project_names = files)

@app.route("/editor/<name>/")
def editor(name):
    
    loc = './static/data/story/'+name+ '/'+name+'.txt'
    with open(loc) as f:
        lines = f.read()
        # lines = " ".join(lines.split())
    # lines = lines.splitlines()
    NLP.save_story(lines)

    return render_template("index.html", doc=lines, name= name)

@app.route("/get_data", methods=["POST"])
def get_data():
    req = request.get_json(force=True)
    name = req['name']
    f = open('./static/data/story/'+name+ '/'+name+'.json')
    data = json.load(f)

    return jsonify(data=data)

@app.route("/get_coref_clusters", methods=["POST"])
def get_coref_clusters():
    req = request.get_json(force=True)
    # num_parts = req['num_parts']
    # parts_regex = req['parts_regex']
    # chapters_regex = req['chapters_regex']
    name = req['name']
    # if num_parts != "":
    #     print("first condition")
    #     all_clusters = NLP.get_coref_clusters1(num_parts)
    #     return jsonify(msg="success", coref_clusters= all_clusters, words_index= NLP.token_offsets)
    
    # else:
    #     all_clusters = NLP.get_coref_clusters2()
    #     return jsonify(msg="success", coref_clusters= all_clusters)

    # print(num_parts, parts_regex, num_chapters, chapters_regex)
    f = open('./static/data/story/'+name+ '/'+ name +'_annotation.json')
    all_clusters = json.load(f)
    return jsonify(coref_clusters = all_clusters)
    
        
    # return jsonify(msg="success")


@app.route("/get_annotated_data", methods=["POST"])
def get_annotated_data():
    req = request.get_json(force=True)
    name = req['name']

    f = open('./static/data/story/'+name+ '/'+ name +'_characters.json')
    all_clusters = json.load(f)
    return jsonify(coref_clusters = all_clusters)
    

@app.route("/save_annotated_data", methods=["POST"])
def save_annotated_data():
    req = request.get_json(force=True)
    data = req['data']
    name = req['name']

    with open('./static/data/story/'+name+ '/'+name+'_characters.json', 'w') as f:
        f.write(json.dumps(data, indent=2))

    return jsonify(msg="success")

@app.route("/get_projection_data", methods=["POST"])
def get_projection_data():
    req = request.get_json(force=True)
    frames = req['frames']

    X = np.array([f['embedding'] for f in frames])
    pca = PCA(n_components=2)
    res = pca.fit_transform(X)

    for i, f in enumerate(frames):
        f['x'] = res[i][0]
        f['y'] = res[i][1]

    return jsonify(msg="success", frames = frames)

if __name__ == "__main__":
    app.run(port=5000, debug=True)