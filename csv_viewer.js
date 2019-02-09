let gFiles = null
function handleOptionChange(evt)
{
	if(gFiles){
		// メイン処理
		execute(gFiles)
	}
}

function handleFileChange(evt)
{
	let input_file = document.getElementById("load_file_btn")

	// ファイルが選択されたか
	if(input_file.value){
		console.log("ファイルが選択された:" + input_file.value)
	}else{
		console.log("ファイルが未選択")
	}

	// ファイルが選択されたか
	if(!(input_file.value)) return

	// FileList オブジェクトを取得する
	let files = input_file.files
	gFiles = files

	// メイン処理
	execute(files)
}

function handleFileSelect(evt)
{
	evt.stopPropagation()
	evt.preventDefault()

	let files = evt.dataTransfer.files // FileList object.
	gFiles = files

	// メイン処理
	execute(files)
}

function getEncoding(id)
{
	return document.getElementById(id).value
}


function execute(files)
{
	let encoding = getEncoding('encode_type')

	// files is a FileList of File objects. List some properties.
	let output = []
	for (let i = 0, f; f = files[i]; i++)
	{
		output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
		f.size, ' bytes, ',
		'encoding: <strong>', encoding, '</strong>, ',
		'last modified: ',
		f.lastModifiedDate.toLocaleDateString(), '</li>')
		readFile(f, encoding)
		break
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>'

	// download show display.
	document.getElementById("download_area").classList.remove('no-display')
	// // input area no display.
	// document.getElementById("input_area").classList.add('no-display')
}

function handleDragOver(evt)
{
	evt.stopPropagation()
	evt.preventDefault()
	evt.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy.
}

function isTargetFile(fileName)
{
	if (fileName.search(/.(tsv|csv)$/i) != -1) {
		return true
	}
	return false
}

function readFile(file, encoding)
{
	let text = ""

	// CSVファイルかを判定
	if (file.type.match("application/vnd.ms-excel") ||
		file.type.match("application/x-csv") ||
		isTargetFile(file.name)) {

		let reader = new FileReader()
		reader.onload = function(e) {
			text = e.target.result
			createTable(text)
		}

		reader.loadstart = function(e) { print("onloadstart")}
		reader.onabort = function(e) { print("onabort")}
		reader.onerror = function(e) { print("onerror")}
		reader.loadend = function(e) { print("loadend")}
		reader.readAsText(file, encoding)
	}
	else {
		createTable(text)
	}
}

function getSplitCode($elementId)
{
	let elements = document.getElementById($elementId)
	let splitCode = ','
	switch (elements.value) {
		case "カンマ":
			splitCode = ','
			break
		case "タブ":
			splitCode = '\t'
			break
		default:
			break
	}
	return splitCode
}

function createTable(csvData)
{
	let output = []
	let splitCode = getSplitCode('split_type')
	let headerDisplay = true
	elements = document.getElementById('header_display')
	if ( elements.value == 'OFF' ) {
		headerDisplay = false
	}

	if (csvData == "") {
		document.getElementById('mytable').innerHTML = ''
		output.push('<strong class="error">CSVファイルのみ対応しております。</br>ご了承ください。</strong>')
	}
	else {
		output.push('<table class="type08">')
		let tempArray = csvData.split("\n")
		for (let index = 0; index < tempArray.length; index++) {
			if (tempArray[index].length == 0) {
				continue
			}
			let csletray = csvSplit(tempArray[index], splitCode)
			if (index == 0) {
				if (headerDisplay) {
					output.push('<thead class="scrollHead">')
					output.push('<tr>')
					for (let col = 0; col < csletray.length; col++) {
						output.push('<th nowrap>')
						output.push(getWord(csletray[col]))
						output.push('</th>')
					}
					output.push('</tr>')
					output.push('</thead>')
					output.push('<tbody class="scrollBody">')
				}
				else {
					output.push('<tbody class="scrollBody">')
					output.push('<tr>')
					for (let col = 0; col < csletray.length; col++) {
						output.push('<td>')
						output.push(getWord(csletray[col]))
						output.push('</td>')
					}
					output.push('</tr>')
				}
			}
			else {
				output.push('<tr>')
				for (let col = 0; col < csletray.length; col++) {
					output.push('<td>')
					output.push(getWord(csletray[col]))
					output.push('</td>')
				}
				output.push('</tr>')
			}
		}
		output.push('</tbody>')
		output.push('</table>')
	}

	document.getElementById('mytable').innerHTML = output.join('')
}

function csvSplit(buffer, splitCode)
{
	let output = []
	let prevIndex = 0
	let isTextMode = false
	for (let index = 0; index < buffer.length; index++) {
		if (buffer.charAt(index) == '\"') {
			if (!isTextMode) {
				isTextMode = true
			}
			else {
				isTextMode = false
			}
		}
		if (!isTextMode && buffer.charAt(index) == splitCode) {
			let temp = buffer.substring(prevIndex, index)
			prevIndex = index + 1
			output.push(temp)
		}
	}
	output.push(buffer.substring(prevIndex, buffer.length))
	return output
}

function getWord(value)
{
	let word = ""
	if (value.charCodeAt(0) == 0x22 && value.charCodeAt(value.length-1) == 0x22) {
		if (value.length > 2) {
			word = value.substring(1, value.length-1)
		}
	}
	else if (value.charCodeAt(0) == 0x22 && value.charCodeAt(value.length-2) == 0x22 && value.charCodeAt(value.length-1) == 0xd) {
		if (value.length > 3) {
			word = value.substring(1, value.length-2)
		}
	}
	else {
		word = value
	}

	return escape_html(word)
}

function escape_html(string)
{
	if (typeof string !== 'string') {
		return string
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
	})
}

function getDownloadFilename()
{
	let filename = document.getElementById('dl_filename').value
	document.getElementById('download').download = filename
	return filename
}

function getToEncoding(encoding)
{
	let toEncoding = 'UTF8'
	switch (getEncoding('dl_encode_type').value) {
		case "Shift_JIS":
			splitCode = 'SJIS'
			break
		default:
			break
	}
	return toEncoding
}

function handleDownload()
{
	const filename = getDownloadFilename()
	const joinCode = getSplitCode('dl_split_type')
	const toEncoding = getEncoding('dl_encode_type')

	let rows = document.getElementById('mytable').innerText.split("\n")
	let output = []
	for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
		let row = rows[rowIndex]
		let cols = row.split("\t")
		let outputCols = []
		for (let colIndex = 0; colIndex < cols.length; colIndex++) {
			outputCols.push(cols[colIndex])
		}
		let line = outputCols.join(joinCode)
		output.push(line)
	}
	let srcContent = output.join("\n")
	let srcArray = Encoding.convert(Encoding.stringToCode(srcContent), {
		to: toEncoding,		// to_encoding
	});
	let blob = new Blob([new Uint8Array(srcArray)], { "type" : "text/csv;" })
	
	if (window.navigator.msSaveBlob) { 
		window.navigator.msSaveBlob(blob, filename)

		// msSaveOrOpenBlobの場合はファイルを保存せずに開ける
		window.navigator.msSaveOrOpenBlob(blob, filename)
	} else {
		document.getElementById("download").href = window.URL.createObjectURL(blob)
	}
}
