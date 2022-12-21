from flask import Flask, render_template, request
from flask_mysqldb import MySQL
import math

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'mysql.2223.lakeside-cs.org'
app.config['MYSQL_USER'] = 'student2223'
app.config['MYSQL_PASSWORD'] = 'm545CS42223'
app.config['MYSQL_DB'] = '2223project_1'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
mysql = MySQL(app)

@app.route('/', methods=["GET"])
def index():
    return render_template('index.html.j2')

@app.route('/game', methods=["POST"])
def game():
    name = request.values.get('name')
    if name is "" or name is None:
        name = "bryan"
    return render_template('game.html.j2', name=name)

@app.route('/editor', methods=["GET"])
def editor():
    return render_template('editor.html.j2')

@app.route('/score', methods=["POST"])
def score():
    x = float(request.values.get('x'))
    z = float(request.values.get('z'))
    locationID = int(request.values.get('id'))
    
    cursor = mysql.connection.cursor()
    query = "SELECT x, y, z FROM `bryanchung_locations` WHERE id = " + str(locationID)
    cursor.execute(query)
    mysql.connection.commit()
    data = cursor.fetchall()[0]
    correctX = data['x']
    correctY = data['y']
    correctZ = data['z']

    meters = math.dist([x, z], [correctX, correctZ]) * 0.85 * 100
    score = math.ceil(max(-6 * meters**1.33 + 2000, 0))

    return str(meters) + " " + str(score) + " " + str(correctX) + " " + str(correctY) + " " + str(correctZ)

@app.route('/addlocation', methods=["POST"])
def addLocation():
    x = float(request.values.get('x'))
    y = float(request.values.get('y'))
    z = float(request.values.get('z'))
    id = int(request.values.get('id'))

    cursor = mysql.connection.cursor()
    query = "INSERT INTO bryanchung_locations (id, x, y, z) VALUES (%s, %s, %s, %s);"
    queryVars = (id, x, y, z)
    cursor.execute(query, queryVars)
    mysql.connection.commit()

    return ""

@app.route('/loggame', methods=["POST"])
def logGame():
    score = int(request.values.get('score'))
    name = request.values.get('name')

    if score > 12000:
        score = 12000
    elif score < 0:
        score = 0
    cursor = mysql.connection.cursor()
    query = "INSERT INTO bryanchung_leaderboard (score, name) VALUES (%s, %s);"
    queryVars = (score, name)
    cursor.execute(query, queryVars)
    mysql.connection.commit()

    return ""

@app.route('/results', methods=["POST"])
def results():
    score = request.values.get('score')
    name = request.values.get('name')

    cursor = mysql.connection.cursor()
    query = "SELECT score FROM `bryanchung_leaderboard` ORDER BY score DESC LIMIT 5;"
    cursor.execute(query)
    mysql.connection.commit()
    highscores = cursor.fetchall()
    
    query = "SELECT name FROM `bryanchung_leaderboard` ORDER BY score DESC LIMIT 5;"
    cursor.execute(query)
    mysql.connection.commit()
    names = cursor.fetchall()
    
    return render_template('results.html.j2', score=score, name=name, highscores=highscores, names=names)