<?php

isset($_GET['ws']) or die('`ws` paramater is missing !');
in_array($_GET['ws'], array(
    'search',
    'generique',
    'exact-search',
    'contexte',
    'definition',
    'suggest',
    'terme',
    'test-generique',
    'traduction',
)) or die('`ws` parameter is unknow !');
$ch = curl_init(sprintf('http://www.termsciences.fr/services/opensearch/%s.php?%s', $_GET['ws'], http_build_query($_GET))
);
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
list($header, $contents) = preg_split('/([\r\n][\r\n])\\1/', curl_exec($ch), 2);
curl_close($ch);
$headers = preg_split('/[\r\n]+/', $header);

foreach($headers as $header)
    if (preg_match('/^(?:Content-Type|Content-Language|Set-Cookie):/i', $header))
        header($header);

if($_GET["alt"]=="atom")
{	
	$xslDoc = new DOMDocument();
	$xslDoc->load("xsl/xmlToJson.xsl") or die(1);

	$xmlDoc = new DOMDocument();
	$xmlDoc->loadXML($contents) or die(2);

	$proc = new XSLTProcessor();
	$proc->importStylesheet($xslDoc) or die(3);
	$contents =  $proc->transformToXML($xmlDoc);
	header('Content-Type: text/html; charset=UTF-8', true);
}

echo $contents;
?>
