const path = require("path")
const fs = require("fs")
const Handlebars = require("handlebars")
const _ = require("lodash")

/**
 * @author Ryan
 * @description 도메인별 파일 생성(Controller, Service, Module)
 *
 * @param {Object} config
 */
function domainGenerateFiles(config) {
  const { modules, ...fileInfos } = config.projectStructure

  for (const key in fileInfos) {
    if (Object.hasOwnProperty.call(fileInfos, key)) {
      const element = fileInfos[key]

      new Promise((resolve, reject) => {
        fs.readFile(
          path.join(config.root, config.file_name),
          "utf8",
          (err, data) => {
            if (err) return reject(err)
            const subdir = config.root.replace(
              new RegExp(`${config.templates_dir}[/]?`),
              ""
            )

            //컴파일 될 파일 이름
            const new_filename = config.file_name.replace(
              "___",
              element.domainName
            )

            const target_file = path.resolve(
              config.target_dir,
              subdir,
              new_filename
            )

            const template = Handlebars.compile(data.toString())

            const importRequestDto = element.importRequestDto

            const content = template({
              openbrace: "{",
              closebrace: "}",
              decorator_method: element.decorator_method,
              domainName: element.domainName,
              domainInfo: element.domainInfo,
              importRequestDto,
              rootPath: element.rootPath,
              router: element.router,
            })

            fs.writeFile(target_file, content, "utf8", (err) => {
              if (err) return reject(err)
              resolve()
            })
          }
        )
      })
    }
  }
}

/**
 * @author Ryan
 * @description DTO 파일 생성
 *
 * @param {@} config
 */
function dtoGenerateFile(config) {
  const fileInfos = config.dtoObjectList

  for (const key in fileInfos) {
    if (Object.hasOwnProperty.call(fileInfos, key)) {
      const element = fileInfos[key]

      new Promise((resolve, reject) => {
        fs.readFile(
          path.join(config.root, config.file_name),
          "utf8",
          (err, data) => {
            if (err) return reject(err)
            const subdir = config.root.replace(
              new RegExp(`${config.templates_dir}[/]?`),
              ""
            )

            //컴파일 될 파일 이름
            const new_filename = config.file_name.replace(
              "---",
              element.className
            )

            const target_file = path.resolve(
              config.target_dir,
              subdir,
              new_filename
            )

            const template = Handlebars.compile(data.toString())

            const content = template({
              openbrace: "{",
              closebrace: "}",
              classValidatorList: element.classValidatorList,
              importRequestDto: element.importRequestDto,
              className: element.className,
              variableList: element.variableList,
            })

            fs.writeFile(target_file, content, "utf8", (err) => {
              if (err) return reject(err)
              resolve()
            })
          }
        )
      })
    }
  }
}

/**
 * @author Ryan
 * @description 나머지 파일 생성
 * @param {*} config
 */
function generateFile(config) {
  new Promise((resolve, reject) => {
    const templates_dir = config.templates_dir
    const target_dir = config.target_dir
    const file_name = config.file_name
    const root = config.root
    const data = config.projectStructure

    if (file_name === "app.module.ts") {
      new Promise((resolve, reject) => {
        fs.readFile(path.join(root, file_name), "utf8", (err, content) => {
          if (err) return reject(err)

          const template = Handlebars.compile(content)

          const parsed_content = template({
            openbrace: "{",
            closebrace: "}",
            modules: data.modules,
          })

          const template_path = path.relative(
            templates_dir,
            path.resolve(root, file_name)
          )
          const generated_path = path.resolve(target_dir, template_path)

          fs.writeFile(generated_path, parsed_content, "utf8", (err) => {
            if (err) return reject(err)
            resolve()
          })
        })
      })
    } else {
      fs.readFile(path.resolve(root, file_name), "utf8", (err, content) => {
        if (err) return reject(err)
        try {
          const template = Handlebars.compile(content)
          const parsed_content = template(data)
          const template_path = path.relative(
            templates_dir,
            path.resolve(root, file_name)
          )
          const generated_path = path.resolve(target_dir, template_path)
          fs.writeFile(generated_path, parsed_content, "utf8", (err) => {
            if (err) return reject(err)
            resolve()
          })
        } catch (e) {
          reject(e)
        }
      })
    }
  })
}

module.exports = {
  domainGenerateFiles,
  dtoGenerateFile,
  generateFile,
}
