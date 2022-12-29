const mime = require("mime")
const xl = require("excel4node")
const path = require("path")
const fs = require("fs")

const headerColumns = ["firstname", "lastname", "score", "regNo", "class"]
const options = {
    margins: {
        left: 1.5,
        rightz: 1.5
    },
    font: {
        color: "#ff0800",
        size: 15
    }
}
const createExcelFile = (name, data) => {
    const wb = new xl.Workbook()
    const ws = wb.addWorksheet(name, options)
    let colIndex = 1;
    headerColumns.forEach(element => {
        ws.cell(1, colIndex++).string(element)
    });
    let rowIndex = 2;
    data.forEach(item => {
        let columnIndex = 1
        Object.keys(item).forEach(colName => {
            ws.cell(rowIndex, columnIndex++).string(item[colName])
        })
        rowIndex++
    })
    // const docPath = path.join(__dirname, "results", name + "xlsx")
    // const exist = fs.existsSync(docPath)
    // if (exist) {
    //     fs.unlink(path)
    // }
    wb.write(name + ".xlsx")
}

module.exports = createExcelFile