/**
 * CSV Management Class
 */
class CsvManager
{
	/**
	 * constructor
	 */
	constructor() {
		this.inHeaderExist = true
		this.inEncoding = 'Shift_JIS'
		this.inSplitCode = ','
		this.inFiles = null
		this.csvData = []
		this.table = null
	}

	/**
	 * setter load files
	 * @param FileList files 
	 */
	setLoadFiles(files) {
		this.inFiles = files
	}

	/**
	 * getter load files
	 * 
	 * @return FileList
	 */
	getLoadFiles() {
		return this.inFiles
	}

	/**
	 * setter load encoding
	 * @param string encoding (Shift_JIS, utf-8)
	 */
	setLoadEncoding(encoding) {
		this.inEncoding = encoding
	}

	/**
	 * getter load encoding
	 * @return string encoding (Shift_JIS, utf-8)
	 */
	getLoadEncoding() {
		return this.inEncoding
	}

	/**
	 * 区切り文字の名称をコードに変換
	 * @param string string 区切り文字の名称
	 */
	static cnvString2SplitCode(string) {
		let splitCode = ','
		switch (string) {
			case "タブ":
				splitCode = '\t'
				break
			default:
				break
		}
		return splitCode
	}

	/**
	 * setter load splitCode
	 * @param string splitCode (カンマ, タブ)
	 */
	setLoadSplitCode(splitCode) {
		switch (splitCode) {
			case "カンマ":
				this.inSplitCode = ','
				break
			case "タブ":
				this.inSplitCode = '\t'
				break
			default:
				break
		}
	}

	/**
	 * getter load splitCode
	 * @return string splitCode (',', '\t')
	 */
	getLoadSplitCode() {
		return this.inSplitCode
	}

	/**
	 * setter load headerExist
	 * @param string flag (ON, OFF)
	 */
	setLoadHeaderExist(isExist) {
		if (isExist == 'ON') {
			this.inHeaderExist = true
		} else {
			this.inHeaderExist = false
		}
	}

	/**
	 * getter load headerExist
	 * @return bool true あり
	 * @return bool true なし
	 */
	getLoadHeaderExist() {
		return this.inHeaderExist
	}

	/**
	 * 指定ファイルが CSV ファイルか？
	 * @param string fileName ファイル名
	 * @return boolean true CSV ファイル
	 * @return boolean false 上記以外のファイル
	 */
	isTargetFile(fileName) {
		if (fileName.search(/.(tsv|csv)$/i) != -1) {
			return true
		}
		return false
	}

	/**
	 * ファイルロード処理
	 * 
	 * CSV ファイルを２次元配列でロードします。
	 * ロードに成功した場合、ロードしたデータをパラメータに
	 * createTable を呼び出します。
	 * 
	 * @param string file ロードするファイル名
	 */
	loadFile(file) {	
		csvManager.csvData = []

		// CSV ファイルの場合
		if (file.type.match("application/vnd.ms-excel") ||
			file.type.match("application/x-csv") ||
			this.isTargetFile(file.name)) {

			const splitCode = this.inSplitCode
			let reader = new FileReader()
			reader.onload = function(e) {
				let text = e.target.result
				let tempArray = text.split("\n")
				for (let index = 0; index < tempArray.length; index++) {
					if (tempArray[index].length == 0) {
						continue
					}
					let row = CsvManager.csvSplit(tempArray[index], splitCode)
					csvManager.csvData.push(row)
				}
				createTable(csvManager.csvData)

				// download show display.
				document.getElementById("download_area").classList.remove('no-display')
			}
	
			reader.loadstart = function(e) { print("onloadstart")}
			reader.onabort = function(e) { print("onabort")}
			reader.onerror = function(e) { print("onerror")}
			reader.loadend = function(e) { print("loadend")}
			reader.readAsText(file, this.inEncoding)
		// 上記以外の場合
		} else {
			createTable([])

			// download no display.
			document.getElementById("download_area").classList.add('no-display')
		}
	}

	/**
	 * 区切り文字でバッファを分割して配列で返します。
	 * 
	 * @param string buffer 
	 * @param string splitCode 
	 * @return array １レコードを列で分解した配列
	 */
	static csvSplit(buffer, splitCode)
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

	/**
	 * 単語を html エンコードして取得
	 * 
	 * @param string value 
	 * @return string 
	 */
	getWord(value) {
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
	
		return this.escape_html(word)
	}

	/**
	 * 指定文字列を html エンコードして返します。
	 * 
	 * @param string string 
	 */
	escape_html(string)	{
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

	/**
	 * テーブル生成時の aTable クラスのインスタンスを設定
	 * @param aTable table 
	 */
	setTable(table) {
		this.table = table
	}

	/**
	 * CSV データを２次元配列で取得
	 */
	getCsvDataFormatArray() {
		const tableHtml = this.table.getTable()
		let tbl = document.createElement("table")
		tbl.innerHTML = tableHtml
		const tbody = tbl.querySelector('tbody')
		const rows = tbody.querySelectorAll('tr')
		if (rows == null) {
			return []
		}

		let output = []
		const header = rows[0].querySelectorAll('th')
		if (header.length > 0) {
			let outputHeader = []
			for (let index = 0; index < header.length; index++) {
				outputHeader.push(header[index].innerText)
			}
			output.push(outputHeader)	
		}
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const cols = rows[rowIndex].querySelectorAll('td')
			if (cols.length > 0) {
				let outputCols = []
				for (let colIndex = 0; colIndex < cols.length; colIndex++) {
					outputCols.push(cols[colIndex].innerText)
				}
				output.push(outputCols)
			}
		}
		return output
	}

	/**
	 * CSV データを Bob データで取得
	 * 
	 * @param string joinCode レコード内の単語を結合する文字
	 * @param string toEncodeType 出力する文字コード
	 * @return Blob CSV データ
	 */
	getCsvDataFormatBlob(joinCode, toEncoding) {
		let output = []
		const rows = this.getCsvDataFormatArray()
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			output.push(rows[rowIndex].join(joinCode))
		}
		let srcContent = output.join("\n")
		let srcArray = Encoding.convert(Encoding.stringToCode(srcContent), {
			to: toEncoding,		// to_encoding
		});
		return new Blob([new Uint8Array(srcArray)], { "type" : "text/csv;" })
	}
}

// CSV管理クラスのインスタンス生成
csvManager = new CsvManager()

function handleSplitTypeChange(evt) {
	csvManager.setLoadSplitCode(evt.currentTarget.value)
	handleOptionChange(evt)
}

function handleEncodeTypeChange(evt) {
	csvManager.setLoadEncoding(evt.currentTarget.value)
	handleOptionChange(evt)
}

function handleHeaderExistsChange(evt) {
	csvManager.setLoadHeaderExist(evt.currentTarget.value)
	handleOptionChange(evt)
}

function handleOptionChange(evt) {
	if (csvManager.getLoadFiles() != null) {
		// メイン処理
		execute(csvManager.getLoadFiles())
	}
}

function handleFileChange(evt) {
	let input_file = document.getElementById("load_file_btn")

	// ファイルが選択されたか
	if (input_file.value) {
		console.log("ファイルが選択された:" + input_file.value)
	} else {
		console.log("ファイルが未選択")
	}

	// ファイルが選択されたか
	if (!(input_file.value)) return

	// FileList オブジェクトを取得して設定
	csvManager.setLoadFiles(input_file.files)

	// メイン処理
	execute(csvManager.getLoadFiles())
}

function handleFileSelect(evt) {
	evt.stopPropagation()
	evt.preventDefault()

	// FileList オブジェクトを取得して設定
	csvManager.setLoadFiles(evt.dataTransfer.files)

	// メイン処理
	execute(csvManager.getLoadFiles())
}

function handleDragOver(evt) {
	evt.stopPropagation()
	evt.preventDefault()
	evt.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy.
}

/**
 * メイン処理
 * @param {*} files 
 */
function execute(files) {
	let encoding = csvManager.getLoadEncoding()

	// files is a FileList of File objects. List some properties.
	let output = []
	for (let i = 0, f; f = files[i]; i++) {
		output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
		f.size, ' bytes, ',
		'encoding: <strong>', encoding, '</strong>, ',
		'last modified: ',
		f.lastModifiedDate.toLocaleDateString(), '</li>')
		csvManager.loadFile(f)
		break
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>'
}

/**
 * CSV データを入力としたテーブルを作成
 * @param array csvData CSV データの２次元配列
 */
function createTable(csvData) {
	let output = []
	if (csvData.length == 0) {
		output.push('<strong class="error">CSVファイルのみ対応しております。</br>ご了承ください。</strong>')
		document.getElementById('mytable').innerHTML = output.join('')
		return
	}

	let tbl = document.createElement("table")
	let tblHeader = document.createElement("thead")
	let tblBody = document.createElement("tbody")

	let isNeedHeader = csvManager.getLoadHeaderExist()
	for (let rowIndex = 0; rowIndex < csvData.length; rowIndex++) {
		let record = csvData[rowIndex]
		let row = document.createElement("tr")
		if (isNeedHeader && rowIndex == 0) {
			for (let colIndex = 0; colIndex < record.length; colIndex++) {
				let cell = document.createElement("th")
				let cellText = document.createTextNode(record[colIndex])
				cell.appendChild(cellText)
				row.appendChild(cell)
			}
			tblHeader.appendChild(row)
		} else {
			for (let colIndex = 0; colIndex < record.length; colIndex++) {
				let cell = document.createElement("td")
				let cellText = document.createTextNode(record[colIndex])
				cell.appendChild(cellText)
				row.appendChild(cell)
			}
			tblBody.appendChild(row)
		}
	}
	tbl.appendChild(tblHeader)
	tbl.appendChild(tblBody)

	tblHeader.classList.add("scrollHead")
	tblBody.classList.add("scrollBody")
	tbl.classList.add("js-table")

	document.getElementById('mytable').textContent = null
	document.getElementById('mytable').appendChild(tbl)

	const table = new aTable('.js-table', {
		showBtnList: false,
		lang:'ja',
	});
	csvManager.setTable(table)
}

/**
 * ダウンロード処理
 * 
 * 本メソッドは通常のテーブルを
 * ダウンロードする際に利用します。
 */
function handleDownload() {
	const filename = document.getElementById('dl_filename').value
	document.getElementById('download').download = filename
	const joinCode = CsvManager.cnvString2SplitCode(document.getElementById('dl_split_type').value)
	const toEncoding = document.getElementById('dl_encode_type').value

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

/**
 * ダウンロード処理
 * 
 * 本メソッドは a-table.js を利用したテーブルを
 * ダウンロードする際に利用します。
 */
function handleAtableDownload() {
	const filename = document.getElementById('dl_filename').value
	document.getElementById('download').download = filename
	const joinCode = CsvManager.cnvString2SplitCode(document.getElementById('dl_split_type').value)
	const toEncoding = document.getElementById('dl_encode_type').value
	const blob = csvManager.getCsvDataFormatBlob(joinCode, toEncoding)
	
	if (window.navigator.msSaveBlob) { 
		window.navigator.msSaveBlob(blob, filename)

		// msSaveOrOpenBlobの場合はファイルを保存せずに開ける
		window.navigator.msSaveOrOpenBlob(blob, filename)
	} else {
		document.getElementById("download").href = window.URL.createObjectURL(blob)
	}
}
