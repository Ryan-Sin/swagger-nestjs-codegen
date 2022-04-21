const fs = require("fs")
const path = require("path")
const YAML = require("js-yaml")

async function getFileContent(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, filePath), (err, content) => {
      if (err) return reject(err)
      resolve(content)
    })
  })
}

function parseContent(content) {
  content = content.toString("utf8")
  try {
    return JSON.parse(content)
  } catch (e) {
    return YAML.safeLoad(content)
  }
}

async function bundler(filePath) {
  let content, parsedContent

  try {
    content = await getFileContent(filePath)
  } catch (e) {
    console.error("Can not load the content of the Swagger specification file")
    console.error(e)
    return
  }

  try {
    parsedContent = parseContent(content)
  } catch (e) {
    console.error("Can not parse the content of the Swagger specification file")
    console.error(e)
    return
  }

  return parsedContent
}

module.exports = bundler
