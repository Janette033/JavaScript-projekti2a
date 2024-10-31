// Hakee teatterit Finnkinon API:sta ja täyttää pudotusvalikon
function etsiTeattereita() {
    const xmlhttp = new XMLHttpRequest(); // Tallennetaan XMLHttpRequest-olio muuttujaan
    xmlhttp.open("GET", "https://www.finnkino.fi/xml/TheatreAreas/", true); //Avataan open-metodilla, annetaan pyynnön tyyppi, URL-osoite ja asynkronisuusasetus, joka on true
    xmlhttp.send(); // Lähetetään pyyntö 

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) { // Tarkistetaan onko pyyntö valmis eli 4 ja että pyyntö onnistui eli 200
            const parser = new DOMParser(); // Luodaan DOM-parser olio, joka tallennetaan muuttujaan
            const xml = parser.parseFromString(xmlhttp.responseText, 'text/xml'); // Paristaan tekstimuotoinen xml
            const theaters = xml.getElementsByTagName('TheatreArea'); // Haetaan Finnkinon teatterit
            const theaterSelect = document.getElementById('teatteriSelect'); // Haetaan pudotusvalikko html tiedostosta

            // Lisää teatterit pudotusvalikkoon
            Array.from(theaters).forEach(theater => { // Käydään läpi arrayn avulla kaikki teatterit, jotta voidaan käyttää forEach metodia
                const vaihtoehto = document.createElement('option'); // Luodaan vaihtoehto elementti
                vaihtoehto.value = theater.querySelector('ID').textContent; // Asetetaan arvo etsimällä ID ja luetaan sen tekstisisältö
                vaihtoehto.textContent = theater.querySelector('Name').textContent; // Asetetaan tekstisisältö etsimällä nimi ja luetaan sen tekstisisältö
                theaterSelect.appendChild(vaihtoehto); // Laitetaan vaihtoehdot pudotusvalikkoon
            });

            // Lisätään tapahtumakuuntelija teatterivalitsimelle
            theaterSelect.addEventListener('change', etsiElokuvat);
        }
    };
}

// Lataa teatterit, kun sivu avataan
etsiTeattereita();

let kaikkiElokuvat = []; // Lista kaikista elokuvista 

// Hakee elokuvat valitusta teatterista ja/tai hakusanan perusteella
function etsiElokuvat() {
    const theaterID = document.getElementById('teatteriSelect').value; // Haetaan valittu arvo
    const hakusana = document.getElementById('searchInput').value.toLowerCase(); // Haetaan hakusana, käytetään toLowerCase, jotta pienet ja isot kirjaimet käsitellään samanlailla

    // Haku URL
    const aikatauluUrl = 'https://www.finnkino.fi/xml/Schedule/'; // Tallennetaan aikataulutiedot finnkinon osoitteesta muuttujaan
    let url = aikatauluUrl; // Laitetaan vielä url muuttujaan
    url += `?area=${theaterID}`; // kysely, jotta valitun teatterin elokuvat palautetaan 

    const xmlhttp = new XMLHttpRequest(); // Tallennetaan XMLHttpRequest-olio muuttujaan
    xmlhttp.open("GET", url, true); // Haetaan osoitteesta, joka tallennettiin url muuttujaan
    xmlhttp.send(); // Lähetetään pyyntö

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) { // Tarkistetaan onko pyyntö valmis eli 4 ja että pyyntö onnistui eli 200
            const data = xmlhttp.responseText; // Tallennetaan data muuttujaan
            const parser = new DOMParser(); // Luodaan DOM-parser olio, joka tallennetaan muuttujaan
            const xml = parser.parseFromString(data, 'text/xml'); // Paristaan tekstimuotoinen xml
            const shows = xml.getElementsByTagName('Show'); // Haetaan show elementit xml-tiedostosta

            kaikkiElokuvat = []; // Tyhjennä aiemmat elokuvatulokset

            // Käy läpi elokuvanäytökset, kerätään niistä halutut tiedot ja lisätään elokuvat allMovies-taulukkoon
            Array.from(shows).forEach(show => {
                const title = show.querySelector('Title').textContent.toLowerCase(); // Haetaan elokuvan nimi ja muutetaan se pieniksi kirjaimiksi
                const imageUrl = show.querySelector('EventLargeImagePortrait').textContent; // Haetaan kuva 
                const startTime = show.querySelector('dttmShowStart').textContent; // Haetaan alkamis ajankohta 
                const duration = show.querySelector('LengthInMinutes').textContent; // Haetaan kesto minuuteissa 

                // Tarkista, että elokuvan nimi vastaa hakusanaa
                if (hakusana && !title.includes(hakusana)) {
                    return; // Ohita, jos elokuvan nimi ei vastaa hakua
                }

                // Lisätään listaan tiedot
                kaikkiElokuvat.push({
                    title: title,
                    imageUrl: imageUrl,
                    startTime: new Date(startTime).toLocaleString('fi-FI'),
                    duration: duration,
                });
            });
            näytäElokuvat(kaikkiElokuvat); // Kutsutaan funktiota, joka näyttää haetut elokuvat
        }
    };
}

// Funktio elokuvien näyttämiseen
function näytäElokuvat(elokuvat) {
    const movieContainer = document.getElementById('movieContainer');
    movieContainer.innerHTML = ""; // Tyhjennä aiemmat elokuvanäytöt

    // Luo uusi elokuvanäkymä jokaiselle elokuvalle
    elokuvat.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie-item', 'border', 'p-2', 'mb-3', 'd-flex', 'align-items-center'); // Käytetään valmiita Bootstrap luokkia tyylittelemään
        movieDiv.innerHTML = `
            <img src="${movie.imageUrl}" alt="${movie.title}" style="width: 100px; height: auto; margin-right: 20px;">
            <div>
                <h3>${movie.title}</h3>
                <p>Näytöksen ajankohta: ${movie.startTime}</p>
                <p>Kesto: ${movie.duration} minuuttia</p>
            </div>
        `;
        movieContainer.appendChild(movieDiv); // Lisätään elokuvalaatikkoon
    });

    // Jos elokuvia ei löytynyt
    if (elokuvat.length === 0) {
        movieContainer.innerHTML = "<p>Ei löytynyt elokuvia haun mukaan.</p>"; // Lisätään teksti sivulle
        movieContainer.style.color = 'white'; // Aseta tekstin väri valkoiseksi
    }
}

// Haetaan syöttökenttä
const searchInput = document.getElementById('searchInput'); 

// Lisätään tapahtumakäsittelijä hakukentälle
searchInput.addEventListener('keydown', function(event) { // Lisätään tapahtumakuuntelija
    if (event.key === 'Enter') { // Kun painetaan enteriä
        etsiElokuvat(); // Kutsu elokuvien hakufunktiota
    }
});

// Funktio, joka palauttaa sivun alkuperäiseen tilaan, kun otsikkoa painaa
function palauta() {
    document.getElementById('teatteriSelect').value = "1029"; // Palautetaan ID avulla takaisin "valitse alue/teatteri"
    document.getElementById('searchInput').value = ""; // Tyhjennetään hakukenttä
    document.getElementById('movieContainer').innerHTML = ""; // Tyhjennetään elokuvat
}








