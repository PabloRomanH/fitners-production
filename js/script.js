$(document).ready(function() {
    window.db = new Firebase('https://fitners.firebaseio.com/coaches/');
    $("#searchform").submit(find);
});

function find() {
    var gym = document.getElementById('gym').value;

    $("#results").empty();
    $("#results").append("Buscando...");

    window.db.orderByChild('gym').equalTo(gym).limitToFirst(10).once('value', function(snapshot) {
        if(snapshot.val() === null) {
            // TODO: show no results message
            $("#results").empty();
            $("#results").append("No se encontró nada");
            return;
        }

        var results = snapshot.val();
        console.log('results');
        console.log(results);

        // TODO: sort by number of stars

        $("#results").empty();

        for (var i = 0; i < results.length; i++) {
            if (!results[i]) continue; // HACK: Query results sometimes include undefined elements. Investigate.

            var commentslink = $('<a href="#">valoraciones</a>');

            commentslink.onClick(function () {
                console.log('clicked');
            });

            var newdiv = $("<div></div>")
                .append(results[i].name)
                .append($('<a href="tel:1-555-555-5555">1-555-555-5555</a>'))
                .append(commentslink);
            $("#results").append(newdiv);
        }

    });

    return false;
}
