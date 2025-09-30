/**
 * 📊 진행률 추적 유틸리티
 *
 * 사용자에게 작업 진행 상황을 실시간으로 보여줍니다
 */

import chalk from 'chalk'

export class ProgressTracker {
	constructor(total, label = 'Processing') {
		this.total = total
		this.current = 0
		this.label = label
		this.startTime = Date.now()
		this.errors = 0
	}

	/**
	 * 진행 카운터 증가
	 * @param {string} message - 현재 처리 중인 항목 이름
	 * @param {boolean} isError - 에러 발생 여부
	 */
	increment(message = '', isError = false) {
		this.current++

		if (isError) {
			this.errors++
		}

		const percent = Math.floor((this.current / this.total) * 100)
		const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)

		// ETA (예상 완료 시간) 계산
		const eta =
			this.total > 0 && this.current > 0
				? (((Date.now() - this.startTime) / this.current) * (this.total - this.current)) / 1000
				: 0

		const etaStr = eta > 0 ? `~${eta.toFixed(1)}s 남음` : '완료 임박'

		// 진행률 바 생성
		const barLength = 20
		const filledLength = Math.floor((this.current / this.total) * barLength)
		const bar =
			'█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)

		// 로그 출력
		const statusIcon = isError ? '✗' : '✓'
		const statusColor = isError ? chalk.red : chalk.gray

		console.log(
			statusColor(
				`  [${bar}] ${percent}% (${this.current}/${this.total}) ${statusIcon} ${message} - ${elapsed}s, ${etaStr}`
			)
		)
	}

	/**
	 * 완료 메시지 출력
	 */
	complete() {
		const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1)
		const successCount = this.current - this.errors

		if (this.errors > 0) {
			console.log(
				chalk.yellow(
					`⚠️ ${this.label} 완료: ${successCount}/${this.total} 성공 (${this.errors}개 실패, ${totalTime}s)`
				)
			)
		} else {
			console.log(chalk.green(`✅ ${this.label} 완료: ${this.current}/${this.total} (${totalTime}s)`))
		}
	}

	/**
	 * 현재 진행률 반환
	 */
	getProgress() {
		return {
			current: this.current,
			total: this.total,
			percent: Math.floor((this.current / this.total) * 100),
			elapsed: (Date.now() - this.startTime) / 1000,
			errors: this.errors,
		}
	}
}
