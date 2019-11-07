var exports = module.exports = {};

exports.database = function(db) {
    db.collection("users").add({
        first: "Karen",
        last: "Deng",
        born: 1815
    })
    .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
    
}