const multer = require('multer');
const path = require('path');


// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, 'uploads/'); 
        cb(null, 'public/images'); // Directory where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File naming scheme
        // cb(null, file.originalname)
    }
});

// Multer upload instance
const upload = multer({
    storage: storage
});

module.exports = upload;