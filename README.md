map-editor
==========

<h2>Metody udostępnione przez plugin</h2>
<strong>$('#mapa').mapeditor(json)</strong> - Metoda powoduje zainicjowanie edytora na wskazanym elemencie DOM. Jeśli parametr json zawiera obiekt z opisem mapy, to edytor pokazuje mapę zgodną z opisem. Jeśli parametr json zawiera pusty obiekt lub został pominięty, to edytor pokazuje mapę domyślną (na przykład mapę Polski).

<strong>$('#mapa').mapeditor('getjson')</strong> - Metoda wywołana na wcześniej zainicjowanym edytorze zwraca obiekt JSON zawierający opis mapy znajdującej się w edytorze.
