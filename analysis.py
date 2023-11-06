import math
import re

## load spacy
# import spacy
# nlp = spacy.load("en_core_web_sm")
# # nlp.add_pipe(nlp.create_pipe('sentencizer'))
# nlp.max_length = 2000000

## load allen nlp
# from allennlp.predictors.predictor import Predictor
# import allennlp_models.tagging
# from allennlp_models import pretrained

## regex for spliting story
regex1 = "PART\s+(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT.*)"
regex2 = "Chapter\s+\d+.*"

class Analysis:
    def __init__(self):
        self.main_doc = False
        self.docs = []
        self.sentences = []
        self.token_offsets = []
        self.step_size = 0
        self.coref_predictor = False
        
    def save_story(self, story):
        self.story = story

    def create_docs(self, num_parts):

        self.main_doc = nlp(self.story, disable=["tagger", "parser" , "ner"])
        self.save_sentences()
        self.save_token_index()
        self.save_step_size(num_parts)

    def save_sentences(self):
        self.sentences = []
        self.doc_sentences = list(self.main_doc.sents)
        for sent in self.main_doc.sents:
            self.sentences.append(sent.text)
    
    def save_token_index(self):
        self.token_offsets = []
        for token in self.main_doc:
            self.token_offsets.append(token.idx) 
    
    def save_step_size(self, num_parts):
        self.num_parts = int(num_parts)
        self.step_size = math.floor(len(self.sentences)/self.num_parts)

    def get_coref_clusters1(self, num_parts):
        '''
            This function detects coref_clusters when num of parts
            and num of chapters are provided
        '''
        if not len(self.story):
            print("Error! No story to analyze")
            return

        if not self.main_doc:
            self.create_docs(num_parts)

        if not self.coref_predictor:
            self.coref_predictor = Predictor.from_path(
                "https://storage.googleapis.com/allennlp-public-models/coref-spanbert-large-2021.03.10.tar.gz")

        all_clusters = []
        i = 0
        for k in range(0, len(self.sentences), self.step_size):
            d = {"segment": i}
            if ((k + self.step_size) < len(self.sentences)):
                in_range_sentences = self.sentences[k: k+ self.step_size]
                d['start_char'] = self.doc_sentences[k].start_char
                d['end_char'] = self.doc_sentences[k+ self.step_size].end_char
                d['start_word'] = self.doc_sentences[k].start
            else:
                in_range_sentences = self.sentences[k:]
                d['start_char'] = self.doc_sentences[k].start_char
                d['end_char'] = self.doc_sentences[-1].end_char
                d['start_word'] = self.doc_sentences[k].start
        
            in_range_sentences = ' '.join(in_range_sentences)
            coref_res = self.coref_predictor.predict(in_range_sentences)
            adjusted_cluster = []
            # print(d['start_word'],coref_res['clusters'])
            for cl in coref_res['clusters']:
                new_cl = []
                for c in cl:
                    s = c[0]+ d['start_word']
                    e = c[1] + d['start_word']
                    new_cl.append([s,e])
                adjusted_cluster.append(new_cl)
            d['clusters'] =  adjusted_cluster
            all_clusters.append([d])

            i += 1

        return all_clusters

    def get_cluster_range(self):
        all_clusters = []
        for m in re.finditer(regex1, self.story):
            part_start = m.start()
            all_clusters.append({"start_char": part_start})

        for i, part in enumerate(all_clusters):
            chapters = []
            if i == (len(all_clusters) -1):
                part['end_char'] = len(self.story)
                for m in re.finditer(regex2, self.story[part['start_char']:]):
                    chapter_start = m.start()
                    chapters.append({'start_char':chapter_start + part['start_char']})
            else:
                part['end_char'] = all_clusters[i + 1]['start_char']
                for m in re.finditer(regex2, self.story[part['start_char']: all_clusters[i + 1]['start_char']]):
                    chapter_start = m.start()
                    chapters.append({'start_char':chapter_start + part['start_char']})
                    
            all_clusters[i]['chapters'] = chapters

        for i, part in enumerate(all_clusters):
            for j, chapter in enumerate(part['chapters']):
                if j == (len(part['chapters']) -1):
                    chapter['end_char'] = part['end_char']   
                else:
                    chapter['end_char'] = part['chapters'][j+1]['start_char']

        return all_clusters

    def get_coref_clusters2(self):
        '''
            This function detects coref_clusters by splitting 
            the story to parts and clusters
        '''
        if not len(self.story):
            print("Error! No story to analyze")
            return

        if not self.coref_predictor:
            self.coref_predictor = Predictor.from_path(
                "https://storage.googleapis.com/allennlp-public-models/coref-spanbert-large-2021.03.10.tar.gz")

        all_clusters = self.get_cluster_range()

        for i, part in enumerate(all_clusters):
            for j, chapter in enumerate(part['chapters']):
                print(i,j)
                coref_res = self.coref_predictor.predict(self.story[chapter['start_char']:chapter['end_char']])
                chapter['clusters'] =  coref_res['clusters']

        return all_clusters

        

        

    
