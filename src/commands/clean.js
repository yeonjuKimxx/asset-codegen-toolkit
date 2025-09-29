/**
 * 🧹 Clean 명령어
 *
 * 파일명에서 중복된 폴더명을 제거하는 개별 실행 명령어
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'
import { CleanGenerator } from '../generators/CleanGenerator.js'

/**
 * Clean 명령어 실행
 * @param {object} options - 명령어 옵션
 */
export async function cleanCommand(options) {
	console.log(chalk.blue.bold('🧹 파일명 폴더명 제거 시작...\n'))

	try {
		// 1. 설정 로드
		const configManager = new ConfigManager()
		const config = configManager.loadConfig(options.config)

		console.log(chalk.gray(`📋 설정 파일: ${options.config}`))
		console.log(chalk.gray(`📂 처리 대상: ${config.assetDirectories.filter(d => d.enabled).map(d => d.name).join(', ')}\n`))

		// 2. Clean Generator 실행
		const cleanGenerator = new CleanGenerator(config)
		const processedFiles = await cleanGenerator.generate()

		// 3. 결과 출력
		if (processedFiles.length > 0) {
			console.log(chalk.green.bold(`\n✅ Clean 완료!`))
			console.log(chalk.green(`   처리된 파일: ${processedFiles.length}개`))

			// 상세 결과 출력
			const groupedByDir = processedFiles.reduce((acc, file) => {
				if (!acc[file.assetDir]) acc[file.assetDir] = []
				acc[file.assetDir].push(file)
				return acc
			}, {})

			Object.entries(groupedByDir).forEach(([dirName, files]) => {
				console.log(chalk.blue(`\n📁 ${dirName}:`))
				files.forEach(file => {
					console.log(chalk.gray(`   ${file.originalName} → ${file.newName}`))
				})
			})
		} else {
			console.log(chalk.yellow('⚠️ 처리할 파일이 없습니다.'))
		}

	} catch (error) {
		console.error(chalk.red.bold('\n❌ Clean 실행 실패:'))
		console.error(chalk.red(`   ${error.message}`))

		if (error.stack) {
			console.error(chalk.gray('\n상세 오류:'))
			console.error(chalk.gray(error.stack))
		}

		process.exit(1)
	}
}