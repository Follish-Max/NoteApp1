var Editor = {
	props: ['entityObject'],
	data: function () {
		return {
			entity: this.entityObject
		}
	},
	template: `
		<div class="ui form">
			<div class="field">
				<textarea placeholder="请输入..." rows="5" class="textarea" v-model="entity.body" @input="update"></textarea>
			</div>
		</div>
	`,
	methods: {
		update: function () {
			this.$emit("update")
		}
	}
}

var Note = {
	props: ['entityObject'],
	data: function () {
		return {
			entity: this.entityObject,
			show: true
		}
	},
	computed: {
		meta: function () {
			moment.locale("zh-cn");
			return moment(this.entity.meta.created).fromNow();
		},
		word: function () {
			return this.entity.body.length;
		},
		header: function () {
			return _.truncate(this.entity.body, {
				length: 30
			});
		}
	},
	template: `
		<div class="item">
			<div class="meta">
				{{ meta }}
			</div>
			<div class="content">
				<div class="header" @click="show=!show">
					{{ header || '新增笔记'}}
				</div>
				
				<div class="extra">
					<el-collapse-transition>
						<editor :entityObject="entity" @update="save" v-if="show"></editor>
					</el-collapse-transition>
				</div>
				
				{{ word }}字
				<i class="trash icon right floated" @click="open"></i>
			</div>
		</div>
	`,
	components: {
		'editor': Editor
	},
	methods: {
		delEntity: function () {
			this.$emit("delEntity", this.entity.$loki);
		},
		save: function () {
			loadCollection("notes")
				.then(collection => {
					collection.update(this.entity);
					db.saveDatabase();
				})
		},
		open: function () {
			this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.delEntity();
				this.$message({
					type: 'success',
					message: '删除成功!'
				});
			}).catch(() => {
				this.$message({
					type: 'info',
					message: '已取消删除'
				});
			});
		}
	}
}


var Notes = {
	data: function () {
		return {
			entities: []
		}
	},
	created: function () {
		loadCollection("notes")
			.then(collection => {
				var _entities = collection.chain()
					.find()
					.simplesort('$loki', 'isdesc')
					.data()
				console.log(_entities);
				this.entities = _entities;
			})
	},
	template: `
		<div class="ui container notes">
			<div class="ui horizontal divider header">
				<i class="icon paw"></i> Note App --Vue.js
			</div>
			<button class="ui right floated button violet basic" @click="insertEntity">
				添加笔记
			</button>
			<div class="ui items divided">
				<note v-for="entity,index in entities" :entityObject='entity' :key="entity.$loki" @delEntity="deleteEntity"></note>
				<span class="ui small center disabled header"
				v-if="!entities.length">
				当前没有笔记，请按下‘添加笔记’按钮</span>
			</div>
		</div>
	`,
	components: {
		'note': Note
	},
	methods: {
		insertEntity: function () {
			loadCollection("notes")
				.then(collection => {
					var _entity = collection.insert({
						"body": ""
					});
					db.saveDatabase()
					this.entities.unshift(_entity);
				})
		},
		deleteEntity: function (id) {
			var _entities = this.entities.filter(entity => {
				return entity.$loki != id
			})
			this.entities = _entities;
			loadCollection("notes")
				.then(collection => {
					collection.remove({
						'$loki': id
					});
					db.saveDatabase();
					//					console.log(this.entities);
				})
		}
	}
}

var vm = new Vue({
	el: "#app",
	components: {
		'notes': Notes
	},
	template: `
		<notes></notes>
	`
})
