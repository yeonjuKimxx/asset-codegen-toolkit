/**
 * 🚀 메인 Asset 생성기
 *
 * 전체 Asset 생성 프로세스를 조율합니다
 */

import { execSync } from 'child_process'
import { ConfigManager } from '../utils/ConfigManager.js'
import { conditionalFormat } from '../utils/FormattingUtils.js'
import chalk from 'chalk'

export class AssetGenerator {
	constructor(options = {}) {
		this.configPath = options.configPath || './asset-codegen.config.json'
		this.requestedSteps = options.steps || []
		this.dryRun = options.dryRun || false

		this.configManager = new ConfigManager()
	}

	/**
	 * 메인 생성 함수
	 */
	async generate() {
		try {
			console.log(chalk.blue('🚀 Asset 통합 생성 프로세스 시작...'))
			console.log(chalk.blue('📋 올바른 실행 순서: 폴더명 제거 → 새 네이밍 → 타입 생성 → 컴포넌트 생성'))
			console.log('='.repeat(70))

			// 1. 설정 로드 및 검증
			const config = this.configManager.loadConfig(this.configPath)
			const validation = this.configManager.validateConfig(this.configPath)

			if (!validation.isValid) {
				throw new Error(`설정 검증 실패: ${validation.errors.join(', ')}`)
			}

			// 2. 실행할 단계 결정
			const enabledSteps = this.getEnabledSteps(config)

			// 3. 각 단계 실행
			const results = []
			const generatedFiles = []
			let completedSteps = 0

			for (const step of enabledSteps) {
				try {
					console.log(`\n📝 ${completedSteps + 1}/${enabledSteps.length}: ${step.name}`)
					console.log(`   📖 설명: ${step.description}`)
					console.log(`   ⚡ 명령어: ${step.command}`)
					console.log(`   🔄 실행 중...`)

					if (!this.dryRun) {
						const stepResult = await this.executeStep(step, config)
						if (stepResult.generatedFiles) {
							generatedFiles.push(...stepResult.generatedFiles)
						}
					}

					completedSteps++
					console.log(`   ✅ ${step.name} 완료!`)
					results.push({ step: step.name, success: true })
				} catch (error) {
					console.error(`   ❌ ${step.name} 실패:`, error.message)
					console.error(`   💥 중단된 단계: ${completedSteps + 1}/${enabledSteps.length}`)
					results.push({ step: step.name, success: false, error: error.message })
					throw error
				}
			}

			// 4. 포맷팅 실행
			if (generatedFiles.length > 0 && !this.dryRun) {
				await conditionalFormat(generatedFiles, this.configPath)
			}

			// 5. 결과 출력
			console.log('\n' + '='.repeat(70))
			console.log(chalk.green('🎉 Asset 생성 완료!'))
			console.log(chalk.blue(`📊 실행된 단계: ${completedSteps}/${enabledSteps.length}`))

			if (generatedFiles.length > 0) {
				console.log(chalk.blue('\n📁 생성된 구조:'))
				console.log('  - 정리된 asset 파일명들 (폴더명 1회만 적용)')
				console.log('  - TypeScript 타입 정의')
				console.log('  - React Asset 컴포넌트')
				console.log('  - React Hooks')
				console.log('  - 유틸리티 함수')
			}

			return {
				success: true,
				completedSteps,
				totalSteps: enabledSteps.length,
				generatedFiles,
				results,
			}
		} catch (error) {
			console.error(chalk.red('❌ Asset 생성 실패:'), error.message)
			return {
				success: false,
				error: error.message,
			}
		}
	}

	/**
	 * 개별 단계 실행
	 */
	async executeStep(step, config) {
		const { CleanGenerator } = await import('./CleanGenerator.js')
		const { OrganizeGenerator } = await import('./OrganizeGenerator.js')
		const { TypesGenerator } = await import('./TypesGenerator.js')
		const { ComponentsGenerator } = await import('./ComponentsGenerator.js')

		const generatedFiles = []

		switch (step.flagKey) {
			case 'cleanupDuplicates':
				const cleanGen = new CleanGenerator(config)
				const cleanResult = await cleanGen.generate()
				return { generatedFiles: cleanResult.generatedFiles || [] }

			case 'organizeFilenames':
				const organizeGen = new OrganizeGenerator(config)
				const organizeResult = await organizeGen.generate()
				return { generatedFiles: organizeResult.generatedFiles || [] }

			case 'generateTypes':
				const typesGen = new TypesGenerator(config)
				const typesResult = await typesGen.generate()
				return { generatedFiles: typesResult.generatedFiles || [] }

			case 'generateComponent':
				const componentsGen = new ComponentsGenerator(config)
				const componentsResult = await componentsGen.generate()
				return { generatedFiles: componentsResult.generatedFiles || [] }

			default:
				console.warn(`⚠️ 알 수 없는 단계: ${step.flagKey}`)
				return { generatedFiles: [] }
		}
	}

	/**
	 * 활성화된 단계들 반환
	 */
	getEnabledSteps(config) {
		// 모든 가능한 단계 정의
		const ALL_STEPS = [
			{
				name: '스마트 폴더명 제거',
				description: '파일명에서 모든 가능한 폴더명 조합을 스마트하게 제거',
				flagKey: 'cleanupDuplicates',
				required: false,
			},
			{
				name: '새 폴더 구조 네이밍',
				description: '현재 위치 기반으로 폴더 구조를 파일명에 적용',
				flagKey: 'organizeFilenames',
				required: false,
			},
			{
				name: 'Asset 타입 생성',
				description: '최종 정리된 파일명으로 TypeScript 타입 정의 생성',
				flagKey: 'generateTypes',
				required: true, // 항상 실행
			},
			{
				name: 'Asset 컴포넌트 생성',
				description: 'React Asset 컴포넌트, hooks, utils 생성',
				flagKey: 'generateComponent',
				required: false,
			},
		]

		// 특정 단계만 요청된 경우
		if (this.requestedSteps.length > 0) {
			return ALL_STEPS.filter((step) =>
				this.requestedSteps.some(
					(requested) =>
						step.flagKey?.includes(requested.replace(/-/g, '')) ||
						step.name.toLowerCase().includes(requested.toLowerCase())
				)
			)
		}

		// featureFlags에 따라 필터링
		const featureFlags = config.featureFlags || {}

		return ALL_STEPS.filter((step) => {
			// required가 true인 스크립트는 항상 실행
			if (step.required) return true

			// flagKey가 있는 경우 featureFlags에서 확인
			if (step.flagKey) {
				const flag = featureFlags[step.flagKey]
				if (flag && typeof flag === 'object' && 'enabled' in flag) {
					return flag.enabled
				}
				return Boolean(flag)
			}

			return true
		})
	}
}