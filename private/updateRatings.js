

function authHandler(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
    }

    db.once('value', function(snapshot) {
        if(snapshot.val() === null) {
            return;
        }

        snapshot.forEach(function(data) {
            var value = data.val();
            var key = data.key();

            var total = 0;
            var count = 0;

            console.log(value.ratings);

            for (rating in value.ratings) {
                count++;
                total += value.ratings[rating].stars;
            }

            var avg = 0;

            if (count > 0) {
                avg = total / count;
            }

            db.child(key + '/stars').set(avg);
            console.log('average stars', avg);

            // controller.results.push(value);
        });
    });
}

var db = new Firebase('https://fitners.firebaseio.com/coaches/');

var password = window.prompt("Introduce password:","");

db.authWithPassword({
    email    : 'pabloromanh@gmail.com',
    password : password
}, authHandler);
