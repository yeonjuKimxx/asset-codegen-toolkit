/**
 * 🧹 파일명에서 폴더명 제거 생성기
 *
 * Asset 파일명에서 중복된 폴더명을 스마트하게 제거합니다
 */

import { promises as fs } from 'fs'
import { join, dirname, basename, extname } from 'path'
import chalk from 'chalk'

export class CleanGenerator {
	constructor(config) {
		this.config = config
	}

	/**
	 * 폴더명 정리 프로세스 실행
	 */
	async generate() {
		console.log(chalk.blue('🧹 1단계: 파일명에서 폴더명 제거 시작...'))

		const enabledDirectories = this.config.assetDirectories.filter(dir => dir.enabled)

		if (enabledDirectories.length === 0) {
			console.log(chalk.yellow('⚠️ 활성화된 Asset 디렉토리가 없습니다.'))
			return []
		}

		// 1. 모든 폴더명 수집
		const allFolderNames = await this.collectAllFolderNames(enabledDirectories)
		console.log(chalk.gray(`📂 수집된 폴더명: ${Array.from(allFolderNames).join(', ')}`))

		// 2. 각 디렉토리에서 파일명 정리 (병렬 처리 + 부분 실패 허용)
		console.log(chalk.gray(`  🚀 ${enabledDirectories.length}개 디렉토리 병렬 처리 중...`))

		const results = await Promise.allSettled(
			enabledDirectories.map(assetDir =>
				this.cleanFilenamesInDirectory(assetDir, allFolderNames)
			)
		)

		// 결과 분석
		const processedFiles = []
		const errors = []

		results.forEach((result, index) => {
			const dirName = enabledDirectories[index].name

			if (result.status === 'fulfilled') {
				const files = result.value
				processedFiles.push(...files)
				console.log(chalk.gray(`  ✓ ${dirName}: ${files.length}개 파일 처리`))
			} else {
				errors.push({
					dir: dirName,
					error: result.reason
				})
				console.error(chalk.red(`  ✗ ${dirName} 처리 실패: ${result.reason.message}`))
			}
		})

		// 최종 결과 출력
		if (errors.length > 0) {
			console.log(
				chalk.yellow(
					`⚠️ 1단계 완료: ${processedFiles.length}개 파일 처리됨 (${errors.length}개 디렉토리 실패)`
				)
			)
		} else {
			console.log(chalk.green(`✅ 1단계 완료: ${processedFiles.length}개 파일 처리됨`))
		}

		return processedFiles
	}

	/**
	 * 모든 Asset 디렉토리에서 폴더명 수집
	 */
	async collectAllFolderNames(assetDirectories) {
		const allFolderNames = new Set()

		for (const assetDir of assetDirectories) {
			// 베이스 Asset 디렉토리명 추가
			allFolderNames.add(assetDir.name)

			try {
				await this.collectFolderNamesRecursive(assetDir.path, allFolderNames)
			} catch (error) {
				console.warn(chalk.yellow(`⚠️ 디렉토리 스캔 실패: ${assetDir.path} - ${error.message}`))
			}
		}

		return allFolderNames
	}

	/**
	 * 재귀적으로 폴더명 수집
	 */
	async collectFolderNamesRecursive(dirPath, folderNames) {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					folderNames.add(entry.name)
					const subDirPath = join(dirPath, entry.name)
					await this.collectFolderNamesRecursive(subDirPath, folderNames)
				}
			}
		} catch (error) {
			// 디렉토리가 없거나 접근할 수 없는 경우 무시
		}
	}

	/**
	 * 특정 디렉토리에서 파일명 정리
	 */
	async cleanFilenamesInDirectory(assetDir, allFolderNames) {
		const processedFiles = []

		try {
			await this.processDirectoryRecursive(assetDir.path, assetDir, allFolderNames, processedFiles)
		} catch (error) {
			console.error(chalk.red(`❌ 디렉토리 처리 실패: ${assetDir.path} - ${error.message}`))
		}

		return processedFiles
	}

	/**
	 * 재귀적으로 디렉토리 처리
	 */
	async processDirectoryRecursive(dirPath, assetDir, allFolderNames, processedFiles) {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name)

				if (entry.isDirectory()) {
					await this.processDirectoryRecursive(fullPath, assetDir, allFolderNames, processedFiles)
				} else if (this.isAssetFile(entry.name)) {
					const result = await this.cleanSingleFile(fullPath, assetDir, allFolderNames)
					if (result) {
						processedFiles.push(result)
					}
				}
			}
		} catch (error) {
			console.warn(chalk.yellow(`⚠️ 디렉토리 읽기 실패: ${dirPath} - ${error.message}`))
		}
	}

	/**
	 * Asset 파일인지 확인
	 */
	isAssetFile(filename) {
		const ext = extname(filename).toLowerCase().slice(1)
		return this.config.fileGeneration.supportedExtensions.includes(ext)
	}

	/**
	 * 단일 파일명 정리
	 */
	async cleanSingleFile(filePath, assetDir, allFolderNames) {
		const directory = dirname(filePath)
		const originalFilename = basename(filePath)
		const extension = extname(originalFilename)
		const nameWithoutExt = basename(originalFilename, extension)

		// 파일이 실제로 속한 폴더 경로에서 폴더명만 추출
		const relativePath = directory.replace(assetDir.path, '').replace(/^\/+/, '')
		const actualFolders = relativePath ? relativePath.split('/').filter(part => part) : []

		// 베이스 Asset 이름도 제거 대상에 포함
		const foldersToRemove = [assetDir.name, ...actualFolders]

		// 폴더명 제거 로직 (베이스 이름 + 실제로 파일이 있는 폴더만 제거)
		const cleanedName = this.removeFolderNamesFromFilename(nameWithoutExt, foldersToRemove)

		if (cleanedName === nameWithoutExt) {
			// 변경사항 없음
			return null
		}

		const newFilename = cleanedName + extension
		const newFilePath = join(directory, newFilename)

		try {
			await fs.rename(filePath, newFilePath)
			console.log(chalk.green(`  ✓ ${originalFilename} → ${newFilename}`))

			return {
				assetDir: assetDir.name,
				directory,
				originalName: originalFilename,
				newName: newFilename,
				oldPath: filePath,
				newPath: newFilePath
			}
		} catch (error) {
			console.error(chalk.red(`  ✗ 파일명 변경 실패: ${originalFilename} - ${error.message}`))
			return null
		}
	}

	/**
	 * 파일명에서 폴더명들을 제거
	 */
	removeFolderNamesFromFilename(filename, folderNames) {
		let cleanedName = filename
		const separatorChar = this.config.conventions?.separatorChar || '-'

		// 정렬: 긴 것부터 처리하여 부분 매칭 방지
		const sortedFolderNames = Array.from(folderNames).sort((a, b) => b.length - a.length)

		for (const folderName of sortedFolderNames) {
			// 전역 패턴으로 모든 인스턴스를 제거
			const patterns = [
				// 1. 시작 부분: "folderName-" → ""
				new RegExp(`^${this.escapeRegex(folderName)}${this.escapeRegex(separatorChar)}`, 'g'),
				// 2. 중간 부분: "-folderName-" → "-"
				new RegExp(`${this.escapeRegex(separatorChar)}${this.escapeRegex(folderName)}${this.escapeRegex(separatorChar)}`, 'g'),
				// 3. 끝 부분: "-folderName" → ""
				new RegExp(`${this.escapeRegex(separatorChar)}${this.escapeRegex(folderName)}$`, 'g')
			]

			// 변화가 있을 때까지 반복 실행 (같은 폴더명이 여러 번 나타날 수 있음)
			let previousName
			do {
				previousName = cleanedName

				// 시작 패턴 제거
				cleanedName = cleanedName.replace(patterns[0], '')

				// 끝 패턴 제거
				cleanedName = cleanedName.replace(patterns[2], '')

				// 중간 패턴 제거 (구분자 하나만 남김)
				cleanedName = cleanedName.replace(patterns[1], separatorChar)

			} while (cleanedName !== previousName)
		}

		// 연속된 구분자 정리
		const separatorPattern = new RegExp(`${this.escapeRegex(separatorChar)}{2,}`, 'g')
		cleanedName = cleanedName.replace(separatorPattern, separatorChar)

		// 앞뒤 구분자 제거
		const trimPattern = new RegExp(`^${this.escapeRegex(separatorChar)}+|${this.escapeRegex(separatorChar)}+$`, 'g')
		cleanedName = cleanedName.replace(trimPattern, '')

		return cleanedName || 'unnamed'
	}

	/**
	 * 정규식 특수문자 이스케이프
	 */
	escapeRegex(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}
}