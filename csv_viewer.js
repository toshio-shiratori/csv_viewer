var gFiles = null;
function handleOptionChange(evt)
{
	if(gFiles){
		// メイン処理
		execute(gFiles);
	}
}

function handleFileChange(evt)
{
	var input_file = document.getElementById("load_file_btn");

	// ファイルが選択されたか
	if(input_file.value){
		console.log("ファイルが選択された:" + input_file.value);
	}else{
		console.log("ファイルが未選択");
	}

	// ファイルが選択されたか
	if(!(input_file.value)) return;

	// FileList オブジェクトを取得する
	var files = input_file.files;
	gFiles = files;

	// メイン処理
	execute(files);
}

function handleFileSelect(evt)
{
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.
	gFiles = files;

	// メイン処理
	execute(files);
}

function execute(files)
{
	var elements = document.getElementsByName('encode_type');
	var encoding = elements[0].value;

	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, f; f = files[i]; i++)
	{
		output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
		f.size, ' bytes, ',
		'encoding: <strong>', encoding, '</strong>, ',
		'last modified: ',
		f.lastModifiedDate.toLocaleDateString(), '</li>');
		readFile(f, encoding);
		break;
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(evt)
{
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function isTargetFile(fileName)
{
	if (fileName.search(/.(tsv|csv)$/i) != -1) {
		return true;
	}
	return false;
}

function readFile(file, encoding)
{
	var text = "";

	// CSVファイルかを判定
	if (file.type.match("application/vnd.ms-excel") ||
		file.type.match("application/x-csv") ||
		isTargetFile(file.name)) {

		var reader = new FileReader();
		reader.onload = function(e) {
			text = e.target.result;
			createTable(text);
		}

		reader.loadstart = function(e) { print("onloadstart"); };
		reader.onabort = function(e) { print("onabort"); };
		reader.onerror = function(e) { print("onerror"); };
		reader.loadend = function(e) { print("loadend"); };
		reader.readAsText(file, encoding);
	}
	else {
		createTable(text);
	}
}

function createTable(csvData)
{
	var output = [];
	var elements = document.getElementsByName('split_type');
	var splitCode = ',';
	switch (elements[0].value) {
		case "カンマ":
			splitCode = ',';
			break;
		case "タブ":
			splitCode = '\t';
			break;
		default:
			break;
	}

	var headerDisplay = true;
	elements = document.getElementsByName('header_display');
	if ( elements[0].value == 'OFF' ) {
		headerDisplay = false;
	}

	if (csvData == "") {
		document.getElementById('mytable').innerHTML = '';
		output.push('<strong class="error">CSVファイルのみ対応しております。</br>ご了承ください。</strong>');
	}
	else {
		output.push('<table class="type08">');
		var tempArray = csvData.split("\n");
		for (var index = 0; index < tempArray.length; index++) {
			if (tempArray[index].length == 0) {
				continue;
			}
			var csvArray = csvSplit(tempArray[index], splitCode)
			if (index == 0) {
				if (headerDisplay) {
					output.push('<thead class="scrollHead">');
					output.push('<tr>');
					for (var col = 0; col < csvArray.length; col++) {
						output.push('<th nowrap>');
						output.push(getWord(csvArray[col]));
						output.push('</th>');
					}
					output.push('</tr>');
					output.push('</thead>');
					output.push('<tbody class="scrollBody">');
				}
				else {
					output.push('<tbody class="scrollBody">');
					output.push('<tr>');
					for (var col = 0; col < csvArray.length; col++) {
						output.push('<td>');
						output.push(getWord(csvArray[col]));
						output.push('</td>');
					}
					output.push('</tr>');
				}
			}
			else {
				output.push('<tr>');
				for (var col = 0; col < csvArray.length; col++) {
					output.push('<td>');
					output.push(getWord(csvArray[col]));
					output.push('</td>');
				}
				output.push('</tr>');
			}
		}
		output.push('</tbody>');
		output.push('</table>');
	}

	document.getElementById('mytable').innerHTML = output.join('');
}

function csvSplit(buffer, splitCode)
{
	var output = [];
	var prevIndex = 0;
	var isTextMode = false;
	for (var index = 0; index < buffer.length; index++) {
		if (buffer.charAt(index) == '\"') {
			if (!isTextMode) {
				isTextMode = true;
			}
			else {
				isTextMode = false;
			}
		}
		if (!isTextMode && buffer.charAt(index) == splitCode) {
			var temp = buffer.substring(prevIndex, index);
			prevIndex = index + 1;
			output.push(temp);
		}
	}
	output.push(buffer.substring(prevIndex, buffer.length));
	return output;
}

function getWord(value)
{
	var word = "";
	if (value.charCodeAt(0) == 0x22 && value.charCodeAt(value.length-1) == 0x22) {
		if (value.length > 2) {
			word = value.substring(1, value.length-1);
		}
	}
	else if (value.charCodeAt(0) == 0x22 && value.charCodeAt(value.length-2) == 0x22 && value.charCodeAt(value.length-1) == 0xd) {
		if (value.length > 3) {
			word = value.substring(1, value.length-2);
		}
	}
	else {
		word = value;
	}

	return escape_html(word);
}

function escape_html(string)
{
	if (typeof string !== 'string') {
		return string;
	}

	return string.replace(/[&'`"<>]/g, function(match) {
		return {
			'&': '&amp;',
			"'": '&#x27;',
			'`': '&#x60;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;',
		}[match]
	});
}

