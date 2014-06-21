map-editor
==========

Metody udostępnione przez plugin
$('#mapa').mapeditor(json) - Metoda powoduje zainicjowanie edytora na wskazanym elemencie DOM. Jeśli parametr json zawiera obiekt z opisem mapy, to edytor pokazuje mapę zgodną z opisem. Jeśli parametr json zawiera pusty obiekt lub został pominięty, to edytor pokazuje mapę domyślną (na przykład mapę Polski).
$('#mapa').mapeditor('getjson') - Metoda wywołana na wcześniej zainicjowanym edytorze zwraca obiekt JSON zawierający opis mapy znajdującej się w edytorze.
