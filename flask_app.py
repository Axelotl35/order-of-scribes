from flask import Flask, render_template, jsonify, request
import requests
from parser import parse

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/spells')
def fetch_spells():
    url = f'https://dnd5e.wikidot.com/spells:{request.args.get("class")}'
    response = requests.get(url)
    spells = parse(response.content)
    #spells = {}
    # Adjust the selector based on the actual HTML structure of the spell page
    #spells = [spell.get_text() for spell in soup.select('.spell-item')]  # Replace with the correct selector
    #return jsonify(spells)
    return jsonify(spells)

if __name__ == '__main__':
    app.run(debug=True)
    #print(parse(requests.get('https://dnd5e.wikidot.com/spells:wizard').content))
