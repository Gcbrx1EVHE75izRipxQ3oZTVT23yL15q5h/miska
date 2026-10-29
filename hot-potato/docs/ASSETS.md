# RING DIVE — grafiikka ja tuotantopromptit

Grafiikat luotiin tämän tehtävän aikana sisäänrakennetulla ImageGen-työkalulla.
Pääreferenssi oli käyttäjän **Ring Dive: Skybound Potato Adventure.png**.
Koko konseptikuvaa tai siitä rajattuja maisemakappaleita ei käytetä pelissä.
Alkuperäiset generoinnit muunnettiin WebP-tiedostoiksi; hahmo-, siipi- ja
etualaatlaksista erotettiin pelissä erikseen animoitavat elementit.

Kaikki lopulliset grafiikat ovat hakemistossa `hot-potato/assets/`:

| Tiedosto | Tuotantopromptin sisältö |
| --- | --- |
| `sky.webp` | Uusi premium-3D-tyylinen sininen taivas, valkoiset pilvet, vihreät leijuvat saaret, vesiputoukset, etäiset linnat ja vuoret; avoin keskikaista; ei hahmoja, renkaita, tekstiä tai UI:ta. |
| `forest.webp` | Uusi pystysuuntainen yöllinen lumometsä: suuret sammaleiset puut, juuret, turkoosit sienet, kultaiset lyhdyt, vihreä sumu ja valonsäteet. Ei taivassaaria, hahmoja, renkaita tai UI:ta. |
| `crystal.webp` | Sinivioletti kristalliluola, suuret siniset/pinkit/violetit kristallit, turkoosi heijastava vesi, syvyys ja pehmeä hehku; avoin lentokaista, ei hahmoja tai renkaita. |
| `volcano.webp` | Tulivuoria, tummaa basalttia, hehkuvia laavavirtoja, oranssinpunainen taivas ja savu; premium pehmeä 3D-tyyli, avoin lentokaista, ei hahmoja tai renkaita. |
| `space.webp` | Indigo tähtitaivas, syaanin/pinkin/violetin tähtisumun kerrokset, planeetta ja asteroideja; avoin keskikaista, ei hahmoja tai renkaita. |
| `potato.webp` | Pyöreähkö epäsymmetrinen ruskea peruna, hassut suuret silmät, avoin iloinen suu, pinkki kieli, punavalkoiset lenkkarit, oikealle lentävä sivuperspektiivi. Ei kiinteitä siipiä tai liekkejä. Läpinäkyvä atlas. |
| `wing-up.webp`, `wing-down.webp` | Saman premium-3D-hahmon erillinen pieni valkoinen höyhensiipi ylä- ja ala-asennossa, läpinäkyvällä pohjalla. |
| `potato-fall.webp`, `potato-dazed.webp` | Sama hahmo ja kamera: yllättyneet alas katsovat silmät / koomisen pökertynyt ilme, näkyvä kieli ja punavalkoiset kengät. Ei siipiä, renkaita, maisemaa, liekkejä tai tekstiä. |
| `logo.webp` | Täsmälleen RING / DIVE: paksu leikkisä 3D-teksti, kulta ja syaani, tummansininen reunus, kullanvärinen ellipsirengas ja pieni kruunu. Läpinäkyvä pohja. |
| `island.webp`, `root.webp`, `gems.webp`, `lava.webp`, `asteroid.webp` | Läpinäkyvä viiden erillisen maisemaesineen atlas: saari puulla ja vesiputouksella; lumometsän juuri/sienet/lyhty; kristalliryhmä; laavakallio; asteroidi. Ei hahmoja, renkaita tai tekstiä. |

Renkaat piirretään ohjelmallisesti erillisinä taka- ja etukaarina valojen,
varjojen ja hehkun kanssa. Siten niiden aukko, osumageometria, väri ja
piirtojärjestys vastaavat pelilogiikkaa eikä valmiiseen kuvaan piirrettyä rengasta.
