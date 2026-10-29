# RING DIVE — hyväksyntätesti

Testipeli: https://ring-dive-test-miska.miskajauhiainen.chatgpt.site

Tämä on erillinen yksityinen testiympäristö. Tämän toteutuksen haara on
`ring-dive-staging-20261029`. Tässä työssä ei ole kirjoitettu `master`-haaraan
tai muutettu https://hot-potato-play.onrender.com -palvelua.
Työn aikana päähaaraan tuli erillinen PR #1:n yhdistämiscommit
`a66d4cb9516550f779c3f6a6ae3a957c45e69109` (Release RING DIVE browser game).
Sen vuoksi päähaaran tai julkisen palvelun globaalia muuttumattomuutta ei
väitetä; tämä erillinen toteutus ei muuttanut niitä.
CNTCTLSS-verkkosivustoon tai muihin peleihin ei ole tehty muutoksia.

## Alkuperäinen pelituntuma

Lähde on saman repon ensimmäinen toimiva versio, commit
`dc1812d2cb904ccd625ad72bfafa5e573377af66`, sekä löydetty aiempi
`HOT_POTATO_playable.html`. Molemmissa painovoima oli **625** ja
napautuksen asettama pystynopeus **−255**. Uudempi `63952ac` käytti
voimakkaampaa −390-impulssia; sitä ei valittu uuden pelin lähtökohdaksi.

Arvot 625/−255, automaattinen sivuttaisliike ja napautuksella asetettava
nostonopeus säilyvät. Fysiikka päivittyy kiinteästi 120 kertaa sekunnissa.
60 Hz:n ruutu ajaa kaksi fysiikka-askelta, 120 Hz:n ruutu yhden. Ohjaus ei
riipu piirron ruutumäärästä. Aloituskorkeus on prototyypin 275.

## Toteutus

- RING DIVE -logo sekä uusi 3D-tyylinen peruna: isot silmät, kieli,
  punaiset lenkkarit, erikseen animoitavat valkoiset siivet. Iloinen,
  putoava ja pelin päättymisen ilme. Ei liekkipyrstöä tai moottoria.
- Erilliset uudet maisemakuvat, läpinäkyvät lähimaisemaelementit,
  kaksi parallaksinopeutta, ilmakehäpartikkelit ja laavan hienovarainen
  kuumuusvääristymä. Referenssikuvan maisemapaloja ei käytetä.
- Vaakasuorat perspektiivirenkaat, erillinen taka- ja etureuna,
  hehku, materiaalin valot ja renkaiden numerot.
- Järjestyksessä tapahtuva läpäisy ylhäältä alas. Piste kirjataan vasta,
  kun perunan törmäysrunko on kokonaan renkaan tason alapuolella.
  Reunat tarkistetaan liikkeen koko askeleelta, myös noustessa.
  Ohitettu rengas lopettaa pelin; seuraava ei voi korvata sitä.
- PERFECT, pisteet, kerroin (joka kolmas peräkkäinen PERFECT nostaa
  kerrointa, enintään ×5), tauko, jatkaminen, uusi yritys ja selainkohtainen
  paras rengas-/pistetulos.
- Viisi jatkuvan suorituksen maailmaa: 1–15, 16–35, 36–60, 61–90 ja 91+.
  Renkaiden väri, koko, nopeus, korkeuserot ja liike muuttuvat maailmittain.
- Kaksi rengasta ennen rajaa alkava ristihäivytys. Häivytyksen eteneminen
  lasketaan matkasta, jolloin läpäisyn kirjaaminen ei aiheuta hyppyä.
  Suoritus, nopeus, pisteet ja PERFECT-ketju eivät nollaudu.
- Avaruudessa vaihteleva rengasrytmi ja jatkuvasti, hitaasti kasvava
  vaikeus. Nopeus lähestyy 238:aa ja säde 53:a, jotta alkuperäisellä
  fysiikalla säilyy mahdollinen reitti.
- 400 aluksi mukana toimitettavaa fysiikalla validoitua rengasta.
  Lisää generoidaan 100 renkaan erissä Web Workerissa 40 rengasta ennen
  sarjan loppua. Generointi ei pysäytä pääsäikeen lentoa.
- Reitit rakennetaan simuloidun napautussarjan ympärille. Jokaiselle
  renkaalle tarkistetaan myös sarjan paikallinen −2/+2 fysiikka-askeleen
  ajoitussiirto (±16,67 ms). Tämä on mallisarjan paikallinen toleranssi,
  ei lupaus kaikkien mahdollisten napautusvirheiden sietämisestä.

## Testilaboratorio

Aloitusvalikko → **Testilaboratorio**.

Valitse suoraan jokin viidestä maailmasta. Maailmojen rajapainikkeet
aloittavat renkaasta 13, 33, 58 tai 88. Valinnainen automaattinen mallilento
käyttää generaattorin validoitua napautussarjaa. Aloita lento napauttamalla.
Puhelimen levyinen esikatselu näyttää 390 px leveän pelin; tämä ei emuloi
Safaria tai oikeaa kosketuslaitetta. Testitila näkyy pelissä ja tulosruudussa,
eikä se tallenna normaaleja ennätyksiä. Tavallinen PELAA alkaa aina renkaasta 1.

## Suoritetut automaattitestit

Aja repon juuresta:

```sh
node --test hot-potato/tests/engine.test.mjs
```

**16/16 läpi.** Testit kattavat alkuperäisen painovoiman ja impulssin,
alaspäin läpäisyn, ylös kulkemisen ilman pistettä, molemmat reunat molempiin
suuntiin, nopean liikkeen törmäystarkistuksen, reunan lähellä hyväksyttävän
läpäisyn, ohituksen, pakollisen järjestyksen, PERFECT-pisteet ja ketjun
katkeamisen, tauon, maailmarajat 15/16, 35/36, 60/61 ja 90/91, häivytyksen
jatkuvuuden, tilan säilymisen, suorat testialoitukset, 60/120 Hz:n
simuloidun fysiikan yhtenevyyden, 400 renkaan mallilennon, paikallisen
±16,67 ms toleranssin jokaisessa 400 renkaassa sekä sarjan laajennuksen 500:aan.

Lisäksi erillinen pitkä simulaatio generoi ja läpäisi **2 000 rengasta**
yhdessä jatkuvassa suorituksessa. Tämä osoittaa mallireitin saavutettavuuden;
se ei ole ihmispelaajalla tehty pelituntuman hyväksyntä.

## Selainvarmennus ja jäljellä olevat hyväksynnät

Paikallisessa Chrome-testiselaimessa tarkistettu aloitusvalikko, uuden
hahmon ja maiseman piirto, kristalliluolan ja tulivuoren mallilento,
PERFECT-pisteet, testitilan merkinnät, 390 px leveä käyttöliittymä,
tauko ja jatkaminen, tavallisen pelin putoaminen, tulosruutu ja
uudelleenyritys. Tulivuoresta aloittanut mallilento eteni selaimessa
avaruuden renkaaseen 114, pisteet 10 400 ja kerroin ×5 säilyivät.
Alkuvalikkoon palattaessa normaali ennätys säilyi nollana. Aloitusnäkymän kuvakaappaus: [ring-dive-review.jpg](ring-dive-review.jpg).

Yksityisen testijulkaisun käyttöönotto onnistui palvelun vahvistuksen mukaan.
Testiselaimen ChatGPT-kirjautumisen jatkamisen esti automaattinen
hyväksyntätarkistus. Yksityisen URL:n kirjautumisen jälkeistä selainajoa ei
siksi ole varmennettu tässä testiselaimessa.

**Ennen vanhan Render-pelin korvaamista tarvitaan käyttäjän hyväksyntä sekä
käytännön iPhone-/Android-testi:** kosketustuntuma, grafiikan hyväksyntä,
oikean 60/120 Hz:n laitteen suorituskyky, Safari/Chrome, näytön kierto ja
selaimen osoiterivin/safe area -käytös. Pilvitestiselaimen FPS-mittarista ei
voi päätellä puhelimen suorituskykyä; ruudunpäivityslupausta ei anneta.

Graafinen toteutus on 2.5D-spritekompositointi Canvasissa, ei reaaliaikainen
3D-moottori. Maisemat ovat uusia taustakuvia ja erillisiä liikkuvia elementtejä.
Ennätykset ovat paikallisia; online-tulostaulua ei ole tilattu eikä toteutettu.

## Tuotantoon siirto hyväksynnän jälkeen

Tässä työssä ei ole yhdistetty kehityshaaraa `master`-haaraan, muutettu
Render-palvelua tai käynnistetty sen tuotantodeployta. Mahdollinen julkaisu
tehdään erillisellä käyttäjän hyväksynnällä. Renderin on silloin palveltava
koko `hot-potato`-hakemistoa, koska koodi ja grafiikka ovat erillisiä tiedostoja.
