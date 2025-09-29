/**
 * 🚀 초기화 명령어
 *
 * 새 프로젝트에 Asset CodeGen 설정을 초기화합니다
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'

/**
 * init 명령어 핸들러
 * @param {object} options - 명령어 옵션
 */
export async function initCommand(options) {
	const { type = 'nextjs', force = false, output = './asset-codegen.config.json' } = options

	console.log(chalk.blue('🎨 Asset CodeGen 프로젝트 초기화...'))
	console.log(`📋 프로젝트 타입: ${type}`)
	console.log(`📁 설정 파일: ${output}`)

	const configManager = new ConfigManager()

	try {
		// 프로젝트 타입별 기본 설정 생성
		const config = configManager.getDefaultConfig()

		// 프로젝트 타입에 따른 설정 커스터마이징
		config.projectType = type
		config.projectName = process.cwd().split('/').pop() || 'my-project'

		switch (type) {
			case 'nextjs':
				config.assetDirectories = [
					{
						name: 'icons',
						path: 'public/icons',
						enabled: true,
						description: '아이콘 에셋'
					},
					{
						name: 'images',
						path: 'public/images',
						enabled: true,
						description: '이미지 에셋'
					}
				]
				config.fileGeneration.outputDir = 'src/components/asset'
				config.componentGeneration.framework = 'react'
				break

			case 'react':
				config.assetDirectories = [
					{
						name: 'assets',
						path: 'src/assets',
						enabled: true,
						description: '에셋 파일'
					}
				]
				config.fileGeneration.outputDir = 'src/components/asset'
				config.componentGeneration.framework = 'react'
				break

			case 'react-native':
				config.assetDirectories = [
					{
						name: 'assets',
						path: 'assets',
						enabled: true,
						description: '에셋 파일'
					}
				]
				config.fileGeneration.outputDir = 'src/components/asset'
				config.componentGeneration.framework = 'react-native'
				break

			default:
				console.warn(chalk.yellow(`⚠️ 알 수 없는 프로젝트 타입: ${type}. 기본 설정을 사용합니다.`))
		}

		// 설정 파일 생성
		configManager.createConfig(output, config, { force })

		console.log(chalk.green('\n✅ 초기화 완료!'))
		console.log(chalk.blue('\n📋 다음 단계:'))
		console.log(`   1. ${output} 파일을 확인하고 필요시 수정하세요`)
		console.log('   2. Asset 파일들을 해당 디렉토리에 배치하세요')
		console.log('   3. npx asset-codegen generate 명령어로 코드를 생성하세요')

		console.log(chalk.yellow('\n💡 예제 명령어:'))
		console.log('   npx asset-codegen validate-config  # 설정 검증')
		console.log('   npx asset-codegen generate          # 전체 생성')
		console.log('   npx asset-codegen clean             # 폴더명 정리만')

	} catch (error) {
		console.error(chalk.red('❌ 초기화 실패:'), error.message)
		throw error
	}
}