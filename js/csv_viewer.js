/**
 * CSV Management Class
 */
class CsvManager
{
	/**
	 * constructor
	 * 
	 * @param bool headerExist ヘッダ行の有無
	 * @param string encoding 文字コード
	 * @param string splitCode 区切り文字
	 */
	constructor(headerExist = true, encoding = 'auto', splitCode = 'auto') {
		this.inHeaderExist = headerExist
		this.inEncoding = encoding
		this.inSplitCode = splitCode
		this.inFiles = null
		this.csvData = []
		this.csvDataCount = 0
		this.table = null
	}

	/**
	 * データの追加
	 * 空行は無視します。
	 * 
	 * @param string record CSV フォーマットのレコード
	 */
	dataPush(record) {
		if (record.length == 0) {
			return
		}
		this.csvData.push(CsvManager.csvSplit(record, this.inSplitCode))
		this.csvDataCount++
	}

	/**
	 * getter csv data count
	 * @param int データ件数
	 */
	getDataCount() {
		return this.csvDataCount
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
	 * 
	 * @param string string 区切り文字の名称
	 * @return string 区切り文字のコード
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
	 * 区切り文字のコードを名称に変換
	 * 
	 * @param string splitCode 区切り文字のコード
	 * @return string 区切り文字の名称
	 */
	static cnvSplitCode2String(splitCode) {
		let string = 'カンマ'
		switch (splitCode) {
			case "\t":
				string = 'タブ'
				break
			default:
				// Do Nothing.
				break
		}
		return string
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
			case "auto":
				this.inSplitCode = 'auto'
				break
			default:
				// Do Nothing.
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
	 * 区切り文字の自動検出
	 * 
	 * @param string record CSV フォーマットのレコード
	 */
	autoDetectSplitCode(record) {
		if (this.inSplitCode != 'auto') {
			return
		}

		let splitCode = ','
		// 2 個以上のタブが含まれていたらタブ区切りと判断する
		const count = record.split('\t').length - 1
		splitCode = (count >= 2) ? '\t' : splitCode

		this.inSplitCode = splitCode
		const value = CsvManager.cnvSplitCode2String(splitCode)
		document.getElementById("split_type").value = value
		document.getElementById("dl_split_type").value = value
	}

	/**
	 * Unicode に変換した文字列を取得
	 * 
	 * サポートする文字コードは以下のみです。
	 * - utf-8
	 * - Shift_JIS
	 * 
	 * @param Uint8Array codes
	 * @return string unicode に変換した文字列
	 */
	getUnicodeString(codes) {
		let encoding = 'utf-8'
		if (this.inEncoding == 'auto') {
			// 文字コードの自動検出（SJIS のみ判定）
			const detectedEncoding = Encoding.detect(codes)
			encoding = (detectedEncoding == 'SJIS') ? 'Shift_JIS' : encoding
			this.inEncoding = encoding
			document.getElementById("encode_type").value = encoding
			document.getElementById("dl_encode_type").value = encoding
			document.getElementById("dl_line_feed").value = (encoding == 'Shift_JIS') ? 'CRLF' : 'LF'
		} else {
			encoding = this.inEncoding
		}

		// Unicode に変換した文字列を返す
		return Encoding.convert(codes, {
			to: 'unicode',
			from: encoding,
			type: 'string'
		});
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
		// loader animation start.
		document.getElementById("loader").classList.remove('no-display')

		// download no display.
		document.getElementById("download_area").classList.add('no-display')

		csvManager.csvData = []
		csvManager.csvDataCount = 0

		// CSV ファイルの場合
		if (file.type.match("application/vnd.ms-excel") ||
			file.type.match("application/x-csv") ||
			this.isTargetFile(file.name)) {

			let reader = new FileReader()
			reader.onload = function(e) {
				const codes = new Uint8Array(e.target.result);
				// Unicode に変換した文字列を取得
				const text = csvManager.getUnicodeString(codes)
				console.log('encoding: ' +  csvManager.getLoadEncoding())
				let tempArray = text.split("\n")
				const length = tempArray.length
				// 区切り文字の自動検出
				csvManager.autoDetectSplitCode(tempArray[0])
				console.log('splitCode: ' +  csvManager.getLoadSplitCode())
				for (let index = 0; index < length; index++) {
					csvManager.dataPush(tempArray[index])
				}
				createTable(tempArray)
			}
	
			reader.loadstart = function(e) { print("onloadstart")}
			reader.onabort = function(e) { print("onabort")}
			reader.onerror = function(e) { print("onerror")}
			reader.loadend = function(e) { print("loadend")}
			reader.readAsArrayBuffer(file)
		// 上記以外の場合
		} else {
			createTable([])

			// download no display.
			document.getElementById("download_area").classList.add('no-display')

			// loader animation stop.
			document.getElementById("loader").classList.add('no-display')
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
	 * 
	 * @param aTable table 
	 */
	setTable(table) {
		this.table = table
	}

	/**
	 * 文字列の最後にある改行コードを除去
	 * 
	 * @param string text 対象の文字列
	 * @return string 改行コードが除去された文字列
	 */
	trimLineFeed(text) {
		return text.replace(/[\n\r]$/, '')
	}

	/**
	 * th タグに紛れ込んだ td タグを th タグに変換
	 * 
	 * @param HTMLTableElement table 
	 */
	convertTd2Th(table) {
		// 先頭行を抽出
		const rows = table.querySelectorAll('tr')
		let row = rows[0]
		let html = row.innerHTML
		// th タグが利用されているか？
		const result = html.match(/<th>/i)
		if (result != null) {
			const newHtml = html.replace(/<td>/i, '<th>')
			const newHtml2 = newHtml.replace(/<\/td>/i, '</th>')
			row.innerHTML = newHtml2
		}
	}

	/**
	 * CSV データを２次元配列で取得
	 */
	getCsvDataFormatArray() {
		let tbl = document.querySelector("table")
		if (this.table != null) {
			tbl = document.createElement("table")
			const tableHtml = this.table.getTable()
			tbl.innerHTML = tableHtml
			this.convertTd2Th(tbl)
		}
		const rows = tbl.querySelectorAll('tr')
		if (rows == null) {
			return []
		}

		let output = []
		const header = rows[0].querySelectorAll('th')
		if (header.length > 0) {
			let outputHeader = []
			for (let index = 0; index < header.length; index++) {
				const text = this.trimLineFeed(header[index].innerText)
				outputHeader.push(text)
			}
			output.push(outputHeader)	
		}
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const cols = rows[rowIndex].querySelectorAll('td')
			if (cols.length > 0) {
				let outputCols = []
				for (let colIndex = 0; colIndex < cols.length; colIndex++) {
					const text = this.trimLineFeed(cols[colIndex].innerText)
					outputCols.push(text)
				}
				output.push(outputCols)
			}
		}
		return output
	}

	/**
	 * 改行コードを取得
	 * 
	 * @param string lineFeed 改行コードを示す文字列 (CRLF, LF)
	 * @return string 改行コード
	 */
	cnvLineFeed(lineFeed) {
		return lineFeed == 'CRLF' ? '\r\n' : '\n'
	}

	/**
	 * CSV データを Bob データで取得
	 * 
	 * @param string joinCode レコード内の単語を結合する文字
	 * @param string toEncodeType 出力する文字コード
	 * @param string lineFeed レコードに付与する改行コード(CRLF, LF)
	 * @return Blob CSV データ
	 */
	getCsvDataFormatBlob(joinCode, toEncoding, lineFeed) {
		let output = []
		const rows = this.getCsvDataFormatArray()
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			output.push(rows[rowIndex].join(joinCode))
		}
		let srcContent = output.join(this.cnvLineFeed(lineFeed))
		let srcArray = Encoding.convert(Encoding.stringToCode(srcContent), {
			to: toEncoding,		// to_encoding
		});
		return new Blob([new Uint8Array(srcArray)], { "type" : "text/csv;" })
	}
}

/**
 * ページの読み込み完了後のイベントハンドラ
 */
window.onload = function() {
	// ページから設定情報を取得
	const headerDisplay = document.getElementById('header_display').value
	const encodeType = document.getElementById('encode_type').value
	const splitType = document.getElementById('split_type').value

	// CSV管理クラスのインスタンス生成
	csvManager = new CsvManager()
	csvManager.setLoadHeaderExist(headerDisplay)
	csvManager.setLoadEncoding(encodeType)
	csvManager.setLoadSplitCode(splitType)
}

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

/**
 * CSV ファイルを空で新規作成
 * @param {*} evt 
 */
function handleCreateNew(evt) {
	console.log('handleCreateNew')

	const off = 'OFF'
	document.getElementById("header_display").value = off
	csvManager.setLoadHeaderExist(off)

	// コピペ用に 1 セルのテーブルを作成
	const csvData = []
	const row = []
	row.push('ここの内容を削除後、スプレッドシートや Excel の表をコピペで貼り付けてください。')
	csvData.push(row)
	createCsvTable(csvData, 0, 1)

	// ダウンロードエリアの表示
	document.getElementById("download_area").classList.remove('no-display')
	document.getElementById("footer").style.position = 'sticky'
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
		document.getElementById('mytable').textContent = null
		csvManager.loadFile(f)
		break
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>'
}

/**
 * レコードを入力としたテーブルを作成
 * 
 * @param array tempArray レコードの配列
 */
function createTable(tempArray) {
	/**
	 * 処理するデータ量
	 * 
	 * 100 以下に設定してしまうと aTable 利用の兼ね合いで
	 * テーブル表示が期待する内容にならないので注意
	 * @see canUseAtable
	 */
	const procesingDataCount = 1000

	let rowStart = 0
	let rowEnd = procesingDataCount

	// 初期テーブル作成
	createCsvTable(csvManager.csvData, rowStart, rowEnd)

	// 残りのデータをテーブルに追加
	while (rowEnd < csvManager.getDataCount()) {
		rowStart = rowEnd
		rowEnd += procesingDataCount

		// ユーザーに進捗が分かるように非同期で処理を行う
		// 本当はサービスワーカーに処理を任せたい
		let start = rowStart
		let end = rowEnd
		window.setTimeout(function() {
			insertTableRecord(csvManager.csvData, start, end)
		}, 100)
	}

	// ダウンロードエリアの表示とローディングアニメーションの停止
	window.setTimeout(function() {
		document.getElementById("download_area").classList.remove('no-display')
		document.getElementById("loader").classList.add('no-display')
		document.getElementById("footer").style.position = 'sticky'
	}, 100)
}

/**
 * CSV データを入力としたテーブルを作成
 * 
 * MAX 10万行までしか処理しません。
 * なぜなら待ち時間が我慢の限界を超えるため。
 * 
 * @param array csvData CSV データの２次元配列
 * @param int rowStart データ行の開始位置
 * @param int rowEnd データ行の終了位置
 */
function createCsvTable(csvData, rowStart = 0, rowEnd = 100000) {
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
	for (let rowIndex = rowStart; rowIndex < csvData.length; rowIndex++) {
		if (rowIndex >= rowEnd) {
			// 指定された終了位置に到達したので処理中断
			break
		}
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

	// aTable が利用できる場合
	if (this.canUseAtable(tbl)) {
		tbl.classList.add("js-table")
	}
	// 上記以外の場合
	else {
		tbl.classList.add("sticky_table")
	}

	document.getElementById('mytable').textContent = null
	document.getElementById('mytable').appendChild(tbl)

	// aTable が利用できる場合
	if (this.canUseAtable(tbl)) {
		const table = new aTable('.js-table', {
			showBtnList: false,
			lang:'ja',
		});
		csvManager.setTable(table)
	}
	// 上記以外の場合
	else {
		csvManager.setTable(null)
	}
}

/**
 * CSV データをテーブルのレコードとして追加します
 * 
 * @param array csvData CSV データの２次元配列
 * @param int rowStart データ行の開始位置
 * @param int rowEnd データ行の終了位置
 */
function insertTableRecord(csvData, rowStart, rowEnd) {
	let start_ms = new Date().getTime()

	const tbl = document.querySelector("table")
	for (let rowIndex = rowStart; rowIndex < csvData.length; rowIndex++) {
		if (rowIndex >= rowEnd) {
			// 指定された終了位置に到達したので処理中断
			break
		}
		// テーブルの最終行に追加
		let row = tbl.insertRow(-1)
		let record = csvData[rowIndex]
		for (let colIndex = 0; colIndex < record.length; colIndex++) {
			let cell = document.createElement("td")
			let cellText = document.createTextNode(record[colIndex])
			cell.appendChild(cellText)
			row.appendChild(cell)
		}
	}

	let elapsed_ms = new Date().getTime() - start_ms
	console.log('処理時間：' + elapsed_ms + 'ms  rowStart:' + rowStart + ' rowEnd:' + rowEnd)
}

/**
 * aTable の利用有無
 * 
 * 快適に操作できる限界は100行くらいなので
 * 100行を超える場合は、表示のみとする。
 * 
 * @param HTMLTableElement table 
 * @return bool true できる
 * @return bool false できない
 */
function canUseAtable(table) {
	const rows = table.querySelectorAll("tr")
	return rows.length <= 100 ? true : false
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
	const lineFeed = document.getElementById('dl_line_feed').value
	const blob = csvManager.getCsvDataFormatBlob(joinCode, toEncoding, lineFeed)
	
	if (window.navigator.msSaveBlob) { 
		window.navigator.msSaveBlob(blob, filename)

		// msSaveOrOpenBlobの場合はファイルを保存せずに開ける
		window.navigator.msSaveOrOpenBlob(blob, filename)
	} else {
		document.getElementById("download").href = window.URL.createObjectURL(blob)
	}
}
