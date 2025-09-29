/**
 * 📝 Types 명령어
 *
 * TypeScript 타입 정의를 생성하는 개별 실행 명령어
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'
import { TypesGenerator } from '../generators/TypesGenerator.js'

/**
 * Types 명령어 실행
 * @param {object} options - 명령어 옵션
 */
export async function typesCommand(options) {
	console.log(chalk.blue.bold('📝 TypeScript 타입 생성 시작...\n'))

	try {
		// 1. 설정 로드
		const configManager = new ConfigManager()
		const config = configManager.loadConfig(options.config)

		console.log(chalk.gray(`📋 설정 파일: ${options.config}`))
		console.log(chalk.gray(`📂 처리 대상: ${config.assetDirectories.filter(d => d.enabled).map(d => d.name).join(', ')}`))
		console.log(chalk.gray(`📁 출력 디렉토리: ${config.fileGeneration.outputDir}`))
		console.log(chalk.gray(`📄 출력 파일: ${config.fileGeneration.outputFile}\n`))

		// 2. Types Generator 실행
		const typesGenerator = new TypesGenerator(config)
		const result = await typesGenerator.generate()

		// 3. 결과 출력
		if (result && result.success) {
			console.log(chalk.green.bold(`\n✅ Types 생성 완료!`))
			console.log(chalk.green(`   생성된 파일: ${result.outputPath}`))

			if (result.stats) {
				console.log(chalk.blue(`\n📊 생성 통계:`))
				console.log(chalk.gray(`   총 Asset 수: ${result.stats.totalAssets || 0}개`))
				console.log(chalk.gray(`   Asset 디렉토리: ${result.stats.directories || 0}개`))
				console.log(chalk.gray(`   타입 정의: ${result.stats.typeDefinitions || 0}개`))
			}

			if (result.generatedTypes && result.generatedTypes.length > 0) {
				console.log(chalk.blue(`\n🎯 생성된 타입들:`))
				result.generatedTypes.forEach(type => {
					console.log(chalk.gray(`   • ${type}`))
				})
			}
		} else {
			console.log(chalk.yellow('⚠️ 생성할 타입이 없습니다.'))
		}

	} catch (error) {
		console.error(chalk.red.bold('\n❌ Types 생성 실패:'))
		console.error(chalk.red(`   ${error.message}`))

		if (error.stack) {
			console.error(chalk.gray('\n상세 오류:'))
			console.error(chalk.gray(error.stack))
		}

		process.exit(1)
	}
}