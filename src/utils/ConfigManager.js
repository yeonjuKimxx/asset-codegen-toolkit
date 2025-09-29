/**
 * 🛠️ 설정 관리자
 *
 * Asset CodeGen 설정 파일 로드, 검증, 관리
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

export class ConfigManager {
	/**
	 * 설정 파일 로드
	 * @param {string} configPath - 설정 파일 경로
	 * @returns {object} 설정 객체
	 */
	loadConfig(configPath = './asset-codegen.config.json') {
		try {
			if (!existsSync(configPath)) {
				console.warn(`⚠️ 설정 파일을 찾을 수 없습니다: ${configPath}`)
				return this.getDefaultConfig()
			}

			const configContent = readFileSync(configPath, 'utf8')
			const config = JSON.parse(configContent)

			// 기본 설정과 병합
			return this.mergeWithDefaults(config)
		} catch (error) {
			console.warn(`⚠️ 설정 파일 로드 실패: ${error.message}`)
			return this.getDefaultConfig()
		}
	}

	/**
	 * 설정 파일 검증
	 * @param {string} configPath - 설정 파일 경로
	 * @returns {object} 검증 결과
	 */
	validateConfig(configPath = './asset-codegen.config.json') {
		const errors = []

		try {
			const config = this.loadConfig(configPath)

			// 필수 필드 검증
			if (!config.projectName) {
				errors.push('projectName이 필요합니다')
			}

			if (!config.assetDirectories || !Array.isArray(config.assetDirectories)) {
				errors.push('assetDirectories 배열이 필요합니다')
			} else {
				config.assetDirectories.forEach((dir, index) => {
					if (!dir.name) errors.push(`assetDirectories[${index}].name이 필요합니다`)
					if (!dir.path) errors.push(`assetDirectories[${index}].path가 필요합니다`)
				})
			}

			if (!config.fileGeneration?.outputDir) {
				errors.push('fileGeneration.outputDir이 필요합니다')
			}

			return {
				isValid: errors.length === 0,
				errors,
				config
			}
		} catch (error) {
			return {
				isValid: false,
				errors: [`설정 파일 파싱 오류: ${error.message}`],
				config: null
			}
		}
	}

	/**
	 * 기본 설정 반환
	 * @returns {object} 기본 설정
	 */
	getDefaultConfig() {
		return {
			projectName: 'my-project',
			projectType: 'nextjs',
			assetDirectories: [
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
			],
			fileGeneration: {
				outputDir: 'src/components/asset',
				outputFile: 'types.ts',
				supportedExtensions: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
				generateSeparateFiles: false
			},
			typeGeneration: {
				assetNameType: 'AssetName',
				assetPropsType: 'AssetProps',
				pathMapName: 'assetPathMap',
				includeColorTypes: true,
				includeSizeTypes: true
			},
			sizeMapping: {
				xs: 16,
				sm: 20,
				md: 24,
				lg: 32,
				xl: 48
			},
			colorMapping: {
				primary: 'var(--color-primary)',
				secondary: 'var(--color-secondary)',
				gray: 'var(--color-gray)',
				white: '#FDFDFE',
				black: '#1A1A20'
			},
			componentGeneration: {
				enabled: true,
				framework: 'react',
				componentName: 'Asset',
				generateHook: true,
				generateUtils: true,
				description: 'React Asset 컴포넌트, hooks, utils 생성'
			},
			formatting: {
				autoFormat: true,
				formatOnGenerate: true,
				formatGeneratedFilesOnly: true
			},
			featureFlags: {
				generateTypes: {
					enabled: true,
					description: 'TypeScript 타입 정의 생성'
				},
				organizeFilenames: {
					enabled: true,
					description: '파일명 자동 정리',
					options: {
						removeDuplicates: true,
						useBasePath: true
					}
				},
				cleanupDuplicates: {
					enabled: true,
					description: '중복 파일명 패턴 정리'
				},
				generateComponent: {
					enabled: true,
					description: 'Asset 컴포넌트, hooks, utils 생성'
				}
			},
			conventions: {
				namingPattern: '{category}-{subcategory}-{name}',
				separatorChar: '-',
				caseStyle: 'kebab-case'
			}
		}
	}

	/**
	 * 기본 설정과 사용자 설정 병합
	 * @param {object} userConfig - 사용자 설정
	 * @returns {object} 병합된 설정
	 */
	mergeWithDefaults(userConfig) {
		const defaultConfig = this.getDefaultConfig()
		return this.deepMerge(defaultConfig, userConfig)
	}

	/**
	 * 깊은 객체 병합
	 * @param {object} target - 대상 객체
	 * @param {object} source - 소스 객체
	 * @returns {object} 병합된 객체
	 */
	deepMerge(target, source) {
		const result = { ...target }

		Object.keys(source).forEach(key => {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
				result[key] = this.deepMerge(target[key] || {}, source[key])
			} else {
				result[key] = source[key]
			}
		})

		return result
	}

	/**
	 * 설정 파일 생성
	 * @param {string} configPath - 설정 파일 경로
	 * @param {object} config - 설정 객체
	 * @param {object} options - 생성 옵션
	 */
	createConfig(configPath, config, options = {}) {
		const { force = false } = options

		if (existsSync(configPath) && !force) {
			throw new Error(`설정 파일이 이미 존재합니다: ${configPath}. --force 옵션을 사용하여 덮어쓸 수 있습니다.`)
		}

		const configContent = JSON.stringify(config, null, 2)
		writeFileSync(configPath, configContent, 'utf8')

		console.log(`✅ 설정 파일 생성: ${configPath}`)
	}
}