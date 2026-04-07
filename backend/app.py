from flask import Flask

app = Flask(__name__)

# test route to verify that Flask is working
# whenever someone sends a request to /test, it will run test()
@app.route("/test")
def test():
    return {"message": "Flask is working!"}

if __name__ == "__main__":
    # starts Flask server every time change is made to code
    app.run(debug=True)