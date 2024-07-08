const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({
  extended: true
}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn
  })
}

// Verify the token 
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

// Check if the user exists in database
function isAuthenticated({
  email,
  password
}) {
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

// Register New User
server.post('/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const {
    email,
    password
  } = req.body;

  if (isAuthenticated({
      email,
      password
    }) === true) {
    const status = 401;
    const error = true;
    const message = 'Email and Password already exist';
    res.status(status).json({
      status,
      error,
      message
    });
    return
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401
      const error = true
      const message = err
      res.status(status).json({
        status,
        error,
        message
      })
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());
    // console.log(data.users)

    // Get the id of last user
    var last_item_id = data.users[data.users.length - 1].id;

    //Add new user
    data.users.push({
      id: last_item_id + 1,
      email: email,
      password: password,
      img: "http://" + email
    }); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => { // WRITE
      if (err) {
        const status = 401
        const error = true
        const message = err
        res.status(status).json({
          status,
          error,
          message
        })
        return
      }
    });
  });

  // Create token for new user
  // const access_token = createToken({
  //   email,
  //   password
  // })
  const error = false
  const message = "Account Created"
  const tes = {
    error,
    message
  }
  res.status(200).json({
    error,
    message,
    tes
  })
})

// Login to one of the users from ./users.json
server.post('/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const {
    email,
    password
  } = req.body;
  if (isAuthenticated({
      email,
      password
    }) === false) {
    const status = 401
    const error = true
    const message = 'Incorrect email or password'
    res.status(status).json({
      status,
      error,
      message
    })
    return
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401
      const error = true
      const message = err
      res.status(status).json({
        status,
        error,
        message
      })
      return
    };


    // Get current users data
    var data = JSON.parse(data.toString());

    const index = data.users.findIndex(item => item.email === email);

    const user = data.users[index]

    // console.log("user : " + user.toString)

    const token = createToken({
      email,
      password
    })

    const userId = user.id
    const username = user.email

    const error = false
    const message = "success"
    const loginResult = {
      userId,
      username,
      token
    }


    console.log("Access Token:" + token);
    res.status(200).json({
      error,
      message,
      loginResult
    })
  })
})

server.get("/destinasi", (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const error = true
    const message = 'Error in authorization format'
    res.status(status).json({
      status,
      error,
      message
    })
    return
  }

  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const error = true
      const message = 'Access token not provided'
      res.status(status).json({
        status,
        error,
        message
      })
      return
    }

    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const error = true
        const message = err
        res.status(status).json({
          status,
          error,
          message
        })
        return
      }

      // Get all destination data
      var data = JSON.parse(data.toString());

      const error = false
      const message = "List Destinasi"

      var keyUses = ["id", "name", "rating", "lat", "lon", "img", "city"]

      const ListDestinasi = data.destination.map(object => {
        const newObjek = {}
        keyUses.forEach(key => {
          if (object.hasOwnProperty(key)) {
            newObjek[key] = object[key]
          }
        })
        return newObjek
      })

      res.status(200).json({
        error,
        message,
        ListDestinasi
      })

    })

  } catch (err) {
    const status = 401
    const error = true
    const message = 'Error access_token is revoked'
    res.status(status).json({
      status,
      error,
      message
    })
  }
})

// get user
server.get("/user/:id", (req, res) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const error = true
    const message = 'Error in authorization format'
    res.status(status).json({
      status,
      error,
      message
    })
    return
  }

  try {
    fs.readFile("./users.json", (err, data) => {
      if (err) {
        const status = 401
        const error = true
        const message = err
        res.status(status).json({
          status,
          error,
          message
        })
        return
      }

      // Get all users data
      var data = JSON.parse(data.toString());
      const id = req.params.id
      const list = data.users
      const user = list.find(obj => obj.id == id)
      console.log(user)

      if (!user) {
        const status = 404
        const error = true
        const message = 'User not found'
        res.status(status).json({
          status,
          error,
          message
        })
        return;
      }

      const error = false;
      const message = "User found";

      const userData = {
        "userId": user.id,
        "username": "US"+user.email,
        "email": user.email,
        "img": user.img
      }

      res.status(200).json({
        error,
        message,
        userData
      })
    });

  } catch (err) {
    const status = 401
    const error = true
    const message = 'Error access_token is revoked'
    res.status(status).json({
      status,
      error,
      message
    })
  }
})

// Get destinasi berdasarkan id
server.get("/detail/:id_destinasi", (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const error = true
    const message = 'Error in authorization format'
    res.status(status).json({
      status,
      error,
      message
    })
    return
  }

  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const error = true
      const message = 'Access token not provided'
      res.status(status).json({
        status,
        error,
        message
      })
      return
    }

    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const error = true
        const message = err
        res.status(status).json({
          status,
          error,
          message
        })
        return
      }

      // Get all destination data
      var jsonData = JSON.parse(data.toString());

      const id = req.params.id_destinasi

      const list = jsonData.destination

      const found = list.find(obj => obj.id == id);

      if (!found) {
        const status = 404
        const error = true
        const message = 'Destination not found'
        res.status(status).json({
          status,
          error,
          message
        })
        return;
      }

      const error = false;
      const message = "Detail Destinasi";

      res.status(200).json({
        error,
        message,
        detailDestinasi: found
      });

    });

  } catch (err) {
    const status = 401
    const error = true
    const message = 'Error access_token is revoked'
    res.status(status).json({
      status,
      error,
      message
    })
  }
})

server.use(/^(?!\/auth).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const error = true
    const message = 'Error in authorization format'
    res.status(status).json({
      status,
      error,
      message
    })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const error = true
      const message = 'Access token not provided'
      res.status(status).json({
        status,
        error,
        message
      })
      return
    }
    next()
  } catch (err) {
    const status = 401
    const error = true
    const message = 'Error access_token is revoked'
    res.status(status).json({
      status,
      error,
      message
    })
  }
})

server.use(router)

server.listen(8080, () => {
  console.log('Run Auth API Server')
})