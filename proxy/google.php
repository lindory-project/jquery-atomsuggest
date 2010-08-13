<?php

isset($_GET['ws']) or die('`ws` paramater is missing !');
$urls = array(
    'picasaweb'  => 'http://picasaweb.google.com/data/feed/base/all?%s',
    'codesearch' => 'http://www.google.com/codesearch/feeds/search?%s',
    'blogsearch' => 'http://blogsearch.google.com/blogsearch_feeds?%s',
    'newssearch' => 'http://news.google.com/news?%s',
);
isset($urls[$_GET['ws']]) or die('`ws` parameter is unknow !');

//die(sprintf($urls[$_GET['ws']], http_build_query($_GET)));
$ch = curl_init(sprintf($urls[$_GET['ws']], http_build_query($_GET)));
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt($ch, CURLOPT_PROXY, 'proxyout.inist.fr:8080'); 
list($header, $contents) = preg_split('/([\r\n][\r\n])\\1/', curl_exec($ch), 2);
curl_close($ch);
$headers = preg_split('/[\r\n]+/', $header);

foreach($headers as $header)
    if (preg_match('/^(?:Content-Type|Content-Language|Set-Cookie):/i', $header))
        header($header);

if($_GET["alt"]=="atom")
{	
	$xslDoc = new DOMDocument();
	$xslDoc->load(dirname(__FILE__)."/../xsl/xml2json.xsl") or die(1);

	$xmlDoc = new DOMDocument();
	$xmlDoc->loadXML($contents) or die(2);

	$proc = new XSLTProcessor();
	$proc->importStylesheet($xslDoc) or die(3);
    $contents =  $proc->transformToXML($xmlDoc);
	header('Content-Type: application/json; charset=UTF-8', true);
}

echo $contents;
?>
