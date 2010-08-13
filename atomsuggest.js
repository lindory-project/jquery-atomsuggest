//
// jquery.atomsuggest.js, licensed under the MIT license.
//
// (c) 2010 INIST-CNRS, Nicolas Thouvenin <nicolas.thouvenin@inist.fr>
//
// For the full copyright and license information, please view the LICENSE
// file that was distributed with this source code.
//
(function($) {
			$.fn.atomsuggest = function(options) {

				function highlight(saisie)
				{
						$("div.hentry p.headline, div.hentry p.content, div.divselector p.headline, div.divselector p.content", _AS_context).each( function() {
								var chaine="";

								if($(this).text().search(saisie) != -1) {
										chaine+=$(this).text().substr(0,$(this).text().search(saisie));
										chaine+="<span class='highlight'>"+$(this).text().substr($(this).text().search(saisie),saisie.length);
										var nbDebutFinValeur = $(this).text().search(saisie)+(saisie.length);
										var nbFinValeurFin = $(this).text().length-($(this).text().search(saisie)+(saisie.length));
										chaine+="</span>"+$(this).text().substr(nbDebutFinValeur, nbFinValeurFin)
										$(this).empty();
										$(this).append(chaine);
								}
						});
				}


				function uget(v) 
				{
						return typeof(v) == "function" ? v() : v;
				}

				function valof(entry) 
				{
						if (typeof entry.$t != 'undefined')
							return entry.$t;
						else if (typeof entry.value != 'undefined')
							return entry.value;
						else
							return '';
				}

				function content2p(content)	
				{
						if (content.type=="html" || content.type == "text/html")
								return $("<p>").addClass("content").html(valof(content));
						else
								return $("<p>").addClass("content").text(valof(content));
					}

				function entry2div(entry)
				{
					var div = $("<div>").addClass("hentry");

					$("<p>").addClass("headline").append(valof(entry.title)).appendTo(div);
					if (_AS_options.showInfos.identifier && entry.id)
							$("<p>").addClass("identifier").append(valof(entry.id)).appendTo(div);

					if (_AS_options.showInfos.updated && entry.updated)
							$("<p>").addClass("updated").append(valof(entry.updated)).appendTo(div);

					if (_AS_options.showInfos.content && entry.content) {
							if (entry.content[0])
									$.each(entry.content, function(i, item) { content2p(item).appendTo(div); });
							else
									content2p(entry.content).appendTo(div);
					}
					div.mousedown(function () {
									$(_AS_inputField).attr("value", $(this).find("p.headline").text());

									if (typeof(_AS_options.onSelect) == "function") {
										_AS_options.onSelect(entry);
									}
									});
					div.mouseover(function() {
									if(_highlightedSuggestionDiv) {
									$(_highlightedSuggestionDiv).attr("class", "hentry");
									}
									$(this).attr("class", "divselector");
									});
					div.mouseout(function() {
									$(this).attr("class", "hentry");
									});
					return div;
				}

				var _AS_options      = $.extend( {
						"url": "",
						"widthFactor": 1,
						"showInfos": {"identifier": false, "updated": false, "content": false, "result": false},
						"paramValue": "",
						"extramParam": {"ws": "", "alt": "", "action": "", "lang": "fr"},
						"triggerLength" : 3,
						"onSelect" : null,
						"onRequest" : null
				}, options);
				var _AS_inputField   = $(this);
				var _AS_lastCall;
				var _AS_lastResponse = "";
  			var _AS_lastKeyCode;
			


  			$(_AS_inputField).attr("autocomplete", "off");

				var _AS_context      = $("<div>").appendTo(_AS_inputField.parent()).addClass("feed").addClass("atomsuggest").css({
						zIndex: "1",
						left: $(_AS_inputField).offset().left +"px",
						top: $(_AS_inputField).offset().top +$(_AS_inputField).height()+7+"px",
						width: function() {
								if (_AS_options.widthFactor)
										return $(_AS_inputField).width()*_AS_options.widthFactor+"px";
								else
										return $(_AS_inputField).width()+"px";
						}
				});

				if($.browser.opera) {
						$(_AS_context).css("width", parseInt($(_AS_inputField).css("width"))*parseInt(_AS_options.widthFactor)+"px");
						$(_AS_context).css("top", parseInt($(_AS_inputField).offset().top)+parseInt($(_AS_inputField).css("height"))+7+"px");
  			}

				var _AS_currentValue = $(_AS_inputField).attr("value");
  			var _AS_lastValue = _AS_currentValue;

				$(document).keydown( function (event) {
						// accès evenement compatible IE/Firefox
						if (!event&&window.event) {
								event=window.event;
						}
						if(event) {
								_AS_lastKeyCode=event.keyCode;
						}
  			});

				$(_AS_inputField).keyup( function(event) {
						setTimeout( function() {
								if(_AS_lastValue != _AS_currentValue && _AS_currentValue.length >= _AS_options.triggerLength) {
									var parameters   = new Object();
									for (cle in _AS_options.extraParams) parameters[cle] = uget(_AS_options.extraParams[cle]);
									parameters[_AS_options.paramValue] = typeof _AS_options.onRequest == 'function' ? _AS_options.onRequest(_AS_currentValue) : _AS_currentValue;

									if(typeof _AS_lastCall != 'undefined') {
										_AS_lastCall.abort();
									}

									$.ajaxSetup({"error":function(XMLHttpRequest,textStatus, errorThrown) {
										while($(" > *", _AS_context).length>0) $(_AS_context).empty();
										//                         alert(textStatus);
										//                         alert(errorThrown);
										//                         alert(XMLHttpRequest.responseText);
										}});

										_AS_lastCall = $.getJSON( uget(_AS_options.url), parameters, function (jsondata) {
														_AS_lastResponse = jsondata;
														while($(" > *", _AS_context).length>0) $(_AS_context).empty();

														if (_AS_lastResponse.feed.entry) {
																if (_AS_lastResponse.feed.entry[0])
																		$.each(_AS_lastResponse.feed.entry, function(i, entry) {entry2div(entry).appendTo($(_AS_context));});
																else
																		entry2div(_AS_lastResponse.feed.entry).appendTo($(_AS_context));
														}

														if(_AS_options.showInfos.result) {
																var nbResultAffich="";
																if(_AS_lastResponse.feed.openSearch$totalResults) {
																		if(parseInt(valof(_AS_lastResponse.feed.openSearch$totalResults))>=parseInt(valof(_AS_lastResponse.feed.openSearch$itemsPerPage)))
																				nbResultAffich = valof(_AS_lastResponse.feed.openSearch$itemsPerPage);
																		else
																				nbResultAffich = valof(_AS_lastResponse.feed.openSearch$totalResults)-1;

																		$("<div>").addClass("result")
																				.append("Résultats : <span>"+(parseInt(nbResultAffich))+ "</span> sur <span>"+(parseInt(valof(_AS_lastResponse.feed.openSearch$totalResults))-1)+"</span>")
																				.appendTo($(_AS_context));
																}
																else {
																		$("<div>").addClass("result")
																				.append("<span>"+suggestDivRows+"</span> résultat(s) affiché(s)")
																				.appendTo($(_AS_context));
																}
														}

														//highlight pour les mots ne commencant pas par une minuscule
														highlight(_AS_currentValue.substring(0,1).toLowerCase()+_AS_currentValue.substring(1))

														//highlight pour les mots commencant par une majuscule
														highlight(_AS_currentValue.substring(0,1).toUpperCase()+_AS_currentValue.substring(1))
										});
								$(_AS_inputField).focus()	;
						}
						_AS_lastValue=_AS_currentValue;
						return true;
  					}, 100);

						// accès evenement compatible IE/Firefox
  					if(!event&&window.event) event=window.event;

  					_eventKeycode=event.keyCode;

						// Dans les cas touches touche haute(38) ou touche basse (40)
						// on autorise le blur du champ (traitement dans onblur)
						if(_eventKeycode == 40 || _eventKeycode == 38) {
								$(_AS_inputField).blur();
								$(_AS_inputField).focus();
						}

						// si la touche n'est ni haut, ni bas, on stocke la valeur utilisateur du champ
					
						if(_eventKeycode != 40 && _eventKeycode != 38)
  						_AS_currentValue = $(_AS_inputField).attr("value");

						if(_eventKeycode == 40) {
								highlightNewValue(_highlightedSuggestionIndex+1, _AS_context, _AS_inputField);
						}
						else if(_eventKeycode == 38) {
								highlightNewValue(_highlightedSuggestionIndex-1, _AS_context, _AS_inputField);
						}
						else if( (_eventKeycode == 13 || _eventKeycode==3) && typeof(_AS_options.onSelect) == "function" &&  typeof(_AS_lastResponse.feed.entry[_highlightedSuggestionIndex]) != 'undefined') {
								_AS_options.onSelect(_AS_lastResponse.feed.entry[_highlightedSuggestionIndex]);
						}
						else if(_eventKeycode != 0) {
								PressAction(_AS_context, _AS_inputField, _AS_currentValue);
						}
						
  			});

				// recalcule la taille des suggestions
				$(window).resize( function() {
						$(_AS_context)
								.width($(_AS_inputField).width()*_AS_options.widthFactor+"px")
								.offset({
										top : $(_AS_inputField).offset().top +$(_AS_inputField).height()+7,
										left: $(_AS_inputField).offset().left
								});
				});
		}

	var suggestDivRows = 0;
	var suggestDivDivList = null;
	var _highlightedSuggestionIndex = -1;
	var _highlightedSuggestionDiv = null;

	// gère une touche pressée autre que haut/bas/enter
	function PressAction(_AS_context, _AS_inputField, _AS_currentValue)
	{
		_highlightedSuggestionIndex=-1;

		var suggestionList=$("div.hentry", _AS_context);

		var suggestionLongueur=suggestionList.length;

		// nombre de possibilités de complétion
		suggestDivRows=suggestionLongueur;

		// possiblités de complétion
		suggestDivDivList=suggestionList;

		// si le champ est vide, on cache les propositions de complétion
		if(_AS_currentValue==""||suggestDivRows==0)
		{
				$(_AS_context).css("visibility", "hidden");
		}else
		{
				$(_AS_context).css("visibility", "visible");

		}
		var trouve=false;
		// si on a du texte sur lequel travailler
		if(_AS_currentValue.length>0)
		{
			var indice=0;

			$("p.headline", _AS_context).each(function(i)
			{
					if ($(this).text().toLowerCase().indexOf(_AS_currentValue.toLowerCase()) == 0)
					{
						trouve=true;
						indice=i;
						return false;
					}

			});
		}

		// si l'entrée utilisateur (n) est le début d'une suggestion (n-1) on sélectionne cette suggestion avant de continuer
		if(trouve)
		{
			_highlightedSuggestionIndex=indice;
			_highlightedSuggestionDiv=$("div:eq("+_highlightedSuggestionIndex+")", _AS_context);
		}else
		{
			_highlightedSuggestionIndex=-1;
			_highlightedSuggestionDiv=null
		}
		var supprSelection=false;

		switch(_eventKeycode)
		{
			// cursor left, cursor right, page up, page down
			case 8:
			case 33:
			case 34:
			case 35:
			case 35:
			case 36:
			case 37:
			case 39:
			case 45:
			case 46:
				// on supprime la suggestion du texte utilisateur
				supprSelection=true;
				break;
				default:
				break
		}
		// si on a une suggestion (n-1) sélectionnée
		if(!supprSelection&&_highlightedSuggestionDiv)
		{
			$(_highlightedSuggestionDiv).attr("class", "divselector");
			var z;

			if(trouve)
			{
				z=$("p.headline:eq("+_highlightedSuggestionIndex+")", _AS_context).text();
			} else
			{
				z=_AS_currentValue;
			}

			if(z!=$(_AS_inputField).attr("value"))
			{
				if($(_AS_inputField).attr("value")!=_AS_currentValue)
				{
					return;
				}
				var input = window.document.getElementById($(_AS_inputField).attr('id'));
				if(input.createTextRange||input.setSelectionRange) {
						$(_AS_inputField).attr("value", z);
						createTextRange(input, _AS_currentValue, $(_AS_inputField).attr("value").length);
				}
				
			}
		}else
		{
			// sinon, plus aucune suggestion de sélectionnée
			_highlightedSuggestionIndex=-1;
		}
	}


	// Change la suggestion en surbrillance
	function highlightNewValue(C, _AS_context, _AS_inputField)
	{
		if(!suggestDivDivList||suggestDivRows<=0)
		{
			return;
		}
		$(_AS_context).css("visibility", "visible");

		if(C>=suggestDivRows)
			C=suggestDivRows-1

		if(_highlightedSuggestionIndex!=-1&&C!=_highlightedSuggestionIndex)
		{
			$(_highlightedSuggestionDiv).attr("class", "hentry");
			_highlightedSuggestionIndex=-1
		}

		if(C<0)
		{
			_highlightedSuggestionIndex=-1;
			$(_AS_inputField).focus();
			return
		}

		_highlightedSuggestionIndex=C;
		_highlightedSuggestionDiv=$("div:eq("+C+")", _AS_context);

		$(_highlightedSuggestionDiv).attr("class", "divselector");
		$(_AS_inputField).attr("value", _highlightedSuggestionDiv.find("p.headline").text());
	}

		function createTextRange(input, value, longueur)
		{
				if(input.createTextRange) {
						var t=input.createTextRange();
						t.moveStart("character", value.length);
						t.select();
				}
				else if(input.setSelectionRange) {
					input.setSelectionRange(value.length, longueur)
				}
		}

})(jQuery);
