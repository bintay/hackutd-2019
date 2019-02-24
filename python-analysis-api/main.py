import nltk
import re
from flask import Flask
from flask import request
from sklearn.feature_extraction.text import TfidfVectorizer
import itertools
import json

app = Flask(__name__)

fillerWords = ['uh', 'uhh', 'uhhh', 'um', 'umm', 'ummm', 'er', 'ah', 'like', 'okay', 'right']

def similarity (text, source):
   sim = []
   for start in range(0, len(nltk.word_tokenize(text)), 1):
      segmentSim = 0
      for offset in range(-100, 100, 50):
         try:
            documents = [source[start * 5 + offset:start * 5 + offset + 20 * 5], text[start * 5:start * 5 + 20 * 5]]
            tfidf = TfidfVectorizer().fit_transform(documents)
            pairwise_similarity = tfidf * tfidf.T
            segmentSim = max(segmentSim, pairwise_similarity[(0, 1)])
         except:
            pass
      sim.append(segmentSim)
   sim = list(reversed(list(itertools.dropwhile(lambda x: x == 0, reversed(sim)))))
   # sim[i] contains the similarity of the document from word i to word i + 20
   # we will give each word a score based on the average of sim[i - 20:i].
   good = []
   overall = 1
   for i in range(1, len(nltk.word_tokenize(text)) - 1, 1):
      good.append(sum(sim[max(0, i - 20):min(len(sim), i)]) / (min(len(sim) - 1, i) - max(0, i - 20)))
   try:
      documents = [source[0:len(nltk.word_tokenize(text)) * 5], text]
      tfidf = TfidfVectorizer().fit_transform(documents)
      pairwise_similarity = tfidf * tfidf.T
      overall = pairwise_similarity[(0, 1)]
      good = list(reversed(list(itertools.dropwhile(lambda x: x == 0 or x > 1, reversed(good)))));
   except:
      pass

   index = 0
   while index < len(good):
      if good[index] < 0.25:
         startIndex = text[:index * 5].rfind(' ') + 1;
         text = text[:startIndex] + '<span class="has-text-warning off-script">' + text[startIndex:]
         while index < len(good) and good[index] < 0.35:
            index = index + 1
         endIndex = index * 5 + text[(index * 5):].find(' ');
         text = text[:endIndex] + '</span>' + text[endIndex:]
      index = index + 1;
   return {'words':good, 'overall': overall, 'text': text};

def highlightFillerWordsFunction (text):
   for word in fillerWords:
      text = re.sub(r'(^|\W)(' + word + r')($|\W)', '\\1<span class="has-text-danger filler">\\2</span>\\3', text, flags=re.IGNORECASE)
   return text

def countFiller (text):
   tokens = nltk.word_tokenize(text)
   return sum(1 if token in fillerWords else 0 for token in tokens)

@app.route('/api/countFillerWords/', methods=["POST"])
def countFillerWords ():
   text = request.form.get('text').lower()
   return str(countFiller(text))

@app.route('/api/highlightFillerWords/', methods=["POST"])
def highlightFillerWords ():
   text = request.form.get('text');
   return str(highlightFillerWordsFunction(text))

@app.route('/api/textSimilarity/', methods=["POST"])
def textSimilarity ():
   source = request.form.get('source')
   text = request.form.get('text')
   return str(similarity(text, source))

@app.route('/api/all/', methods=["POST"])
def all ():
   source = request.form.get('source')
   text = request.form.get('text')
   count = countFiller(text)
   sim = similarity(text, source);
   text = sim['text'];
   text = highlightFillerWordsFunction(text);
   return json.dumps({'html': text, 'count': count, 'overall': sim['overall']})

# print(countFillerWords('Hello! I Think that, uh, that uhh is correct.'))
# print(highlightFillerWords('uh Hello! I Think that, Uh, that uhh is correct.'))

if  __name__ == '__main__':
   app.run(debug=True)
