let frame = {
  states: [],
  text: "",
  copy: function() {
    let newframe = { states: this.states.slice(), text: this.text }
    return newframe
  }
}

Vue.component("visualizer", {
  props: [ "needle", "haystack", "type" ],
  data: function() {
    let ret = { arr: [], frames: [], frameIdx: 0 }
    ret.arr = JSON.parse(this.haystack)
    if (this.type == "binary")
      ret.frames = this.binary_search(ret.arr, parseInt(this.needle))
    else if (this.type == "linear")
      ret.frames = this.linear_search(ret.arr, parseInt(this.needle))
    else if (this.type == "firstgreater")
      ret.frames = this.first_greater(ret.arr, parseInt(this.needle))
    else if (this.type == "ternary")
      ret.frames = this.ternary_search(ret.arr)
    else if (this.type == "greedyfill")
      ret.frames = this.greedy_fill(ret.arr, parseInt(this.needle))
    return ret
  },
  template: `
    <div class="example">
      <input type="range" min="0" :max="frames.length-1" v-model="frameIdx" class="slider">
      <br>
      <template v-for="(val, idx) in arr">
        <template v-if="frames[frameIdx].states[idx] === -3">
          <span class="numberbox ignored">?<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === -2">
          <span class="numberbox">?<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === -1">
          <span class="numberbox ignored">{{val}}<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === 0">
          <span class="numberbox">{{val}}<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === 1">
          <span class="numberbox comparing">{{val}}<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === 2">
          <span class="numberbox accept">{{val}}<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else-if="frames[frameIdx].states[idx] === 3">
          <span class="numberbox discard">{{val}}<sup v-if='type=="ternary"'>{{find_raise(idx)}}</sup></span>
        </template>
        <template v-else>

        </template>
      </template>
      <br>
      <span class="step-num">( {{parseInt(frameIdx)+1}} / {{frames.length}} )</span><br>
      <span class="explanation">{{frames[frameIdx].text}}</span>
    </div>
  `,
  methods: {
    find_raise: function(i) {
      return i == this.arr.length-1 ? "" : (this.arr[i] < this.arr[i+1] ? "▲" : "▼")
    },
    linear_search: function(arr, x) {
      let n = arr.length
      let ret = []
      frame.states = Array(n)
      for (var i = 0; i < n; ++i) {
        for (var j = 0; j < n; ++j) {
          if (j < i) frame.states[j] = -1
          else if (j == i) frame.states[j] = arr[i]==x?2:1
          else frame.states[j] = arr[i]==x?-1:0;
        }
        if (arr[i] == x) {
          frame.text = `A[${i}]=${arr[i]} มีค่าเท่ากับ x=${x} พอดี หยุดการค้นหาได้`
          ret.push(frame.copy())
          break
        } else {
          frame.text = `A[${i}]=${arr[i]} ยังไม่เท่ากับ x=${x} ต้องค้นหาต่อ`
          ret.push(frame.copy())
        }
      }
      return ret
    },

    binary_search: function(arr, x) {
      let n = arr.length
      frame.states = Array(n)
      let l = 0, r = n-1
      let ret = []
      let cnt = 0
      while (l <= r) {
        let m = parseInt((l+r)/2)
        // create range frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else frame.states[i] = 0
          frame.text = `หาค่า x=${x} ในช่วง [${l}, ${r}]`
        }
        ret.push(frame.copy())
        // create comparison frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else if (i == m) frame.states[i] = 1
          else frame.states[i] = 0
          frame.text = `A[${m}] = ${arr[m]} มีค่า`
          if (arr[m] < x) frame.text += `น้อยกว่า x=${x}`
          else if (arr[m] == x) frame.text += `เท่ากับ x=${x} พอดี!`
          else frame.text += `มากกว่า x=${x}`
        }
        ret.push(frame.copy())
        // compare
        if (arr[m] == x) {
          for (var i = 0; i < n; ++i) {
            if (i != m) frame.states[i] = -1
            else frame.states[i] = 2
          }
          frame.text = `เพราะฉะนั้น สามารถหยุดการค้นหาแล้ว return true ได้เลย`
          ret.push(frame.copy())
          return ret
        } else if (arr[m] > x) {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 2
            else if (i > m) frame.states[i] = 3
            else frame.states[i] = 1
          }
          frame.text = `เพราะฉะนั้น ต้องค้นหาต่อในช่วงด้านซ้าย ([${l}, ${m-1}])`
          r = m-1
          ret.push(frame.copy())
        } else if (arr[m] < x) {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 3
            else if (i > m) frame.states[i] = 2
            else frame.states[i] = 1
          }
          frame.text = `เพราะฉะนั้น ต้องค้นหาต่อในช่วงด้านขวา ([${m+1}, ${r}])`
          l = m+1
          ret.push(frame.copy())
        }
      }
      for (var i = 0; i < n; ++i)
        frame.states[i] = -1
      frame.text = `รันมาถึงช่วง [${l}, ${r}] ซึ่งไม่ถูกต้อง จึงสรุปได้ว่าไม่มีค่า x=${x} ใน A`
      ret.push(frame.copy())
      return ret
    },

    first_greater: function(arr, x) {
      let n = arr.length
      frame.states = Array(n)
      let l = 0, r = n-1, ans = 10000, ansidx = -1 
      let ret = []
      let cnt = 0
      while (l <= r) {
        let m = parseInt((l+r)/2)
        // create range frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else frame.states[i] = 0
          if (l == 0 && r == n-1)
            frame.text = `หาจำนวนแรกที่มากกว่า x=${x} ในช่วง [${l}, ${r}] (เริ่มต้นกำหนดให้ ans = -∞)`
          else 
            frame.text = `พิจารณาช่วง [${l}, ${r}] ต่อ (ตอนนี้ ans = ${ans==10000 ? "∞" : ans})`
        }
        ret.push(frame.copy())
        // create comparison frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else if (i == m) frame.states[i] = 1
          else frame.states[i] = 0
          frame.text = `A[${m}] = ${arr[m]} มีค่า`
          if (arr[m] > x) frame.text += `มากกว่า x=${x}! (ใช้ได้)`
          else frame.text += `น้อยกว่า/เท่ากับ x=${x} (ใช้ไม่ได้)`
        }
        ret.push(frame.copy())
        // compare
        if (arr[m] > x) {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 2
            else if (i > m) frame.states[i] = 3
            else frame.states[i] = 1
          }
          ans = arr[m]
          ansidx = m
          frame.text = `จดคำตอบไว้ (ans = ${ans}) แล้วลองหาต่อทางด้านซ้าย ([${l}, ${m-1}])`
          r = m-1
          ret.push(frame.copy())
        } else {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 3
            else if (i > m) frame.states[i] = 2
            else frame.states[i] = 1
          }
          frame.text = `คำตอบยังไม่เปลี่ยน (ans = ${ans == 10000 ? "∞" : ans}) ต้องลองหาต่อทางด้านขวา ([${m+1}, ${r}])`
          l = m+1
          ret.push(frame.copy())
        }
      }
      for (var i = 0; i < n; ++i)
        frame.states[i] = i == ansidx ? 2 : -1
      frame.text = `รันมาถึงช่วง [${l}, ${r}] ก็คือจบแล้ว สรุปว่าคำตอบดีสุดที่จดไว้คือ ans=${ans == 10000 ? "∞" : ans}`
      ret.push(frame.copy())
      return ret
    },

    ternary_search: function(arr) {
      let n = arr.length
      frame.states = Array(n)
      let l = 0, r = n-2, ans = -10000, ansidx
      let ret = []
      let cnt = 0
      while (l <= r) {
        let m = parseInt((l+r)/2)
        // create range frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else frame.states[i] = 0
          if (l == 0 && r == n-2)
            frame.text = `หาตำแหน่งแรกที่มีค่าลดลงในช่วง [${l}, ${r}] (เริ่มต้นกำหนดให้ ans = -∞)`
          else 
            frame.text = `พิจารณาช่วง [${l}, ${r}] ต่อ (ตอนนี้ ans = ${ans==-10000 ? "-∞" : ans})`
        }
        ret.push(frame.copy())
        // create comparison frame
        for (var i = 0; i < n; ++i) {
          if (i < l || i > r) frame.states[i] = -1
          else if (i == m) frame.states[i] = 1
          else frame.states[i] = 0
          frame.text = `ตำแหน่ง m=${m} มีค่า`
          if (arr[m] < arr[m+1]) frame.text += `เพิ่มขึ้น (ใช้ไม่ได้)`
          else frame.text += `ลดลง! (ใช้ได้)`
        }
        ret.push(frame.copy())
        // compare
        if (arr[m] > arr[m+1]) {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 2
            else if (i > m) frame.states[i] = 3
            else frame.states[i] = 1
          }
          ans = arr[m]
          ansidx = m
          frame.text = `จดคำตอบไว้ (ans = ${ans}) แล้วลองหาต่อทางด้านซ้าย ([${l}, ${m-1}])`
          r = m-1
          ret.push(frame.copy())
        } else {
          for (var i = 0; i < n; ++i) {
            if (i < l || i > r) frame.states[i] = -1
            else if (i < m) frame.states[i] = 3
            else if (i > m) frame.states[i] = 2
            else frame.states[i] = 1
          }
          frame.text = `คำตอบยังไม่เปลี่ยน (ans = ${ans==-10000 ? "-∞" :ans}) ต้องลองหาต่อทางด้านขวา ([${m+1}, ${r}])`
          l = m+1
          ret.push(frame.copy())
        }
      }
      for (var i = 0; i < n; ++i)
        frame.states[i] = i == ansidx ? 2 : -1
      frame.text = `รันมาถึงช่วง [${l}, ${r}] ก็คือจบแล้ว สรุปว่าคำตอบดีสุดที่จดไว้คือ ans=${ans == 10000 ? "∞" : ans}`
      ret.push(frame.copy())
      return ret
    },
    greedy_fill: function(arr, cap) {
      let ret = []
      let n = arr.length, sum = 0, prev = 0, cnt = 0
      let ans = Array(n)
      for (var j = 0; j < n; ++j)
        frame.states[j] = 0
      frame.text = `ต้องการบรรจุสิ่งของทั้งหมดโดยแต่ละกล่องรับน้ำหนักได้ไม่เกิน ${cap} กิโลกรัม`
      ret.push(frame.copy())
      for (var i = 0; i < n; ++i) {
        if (i != 0 && sum+arr[i] <= cap) {
          for (var j = 0; j < n; ++j) {
            if (j < prev || j > i) frame.states[j] = -1
            else if (j == i) frame.states[j] = 2
            else frame.states[j] = 0
          }
          frame.text = `เพิ่มของชิ้นใหม่ใส่กล่องเดิมเรื่อย ๆ ... (${sum+arr[i]} ≤ ${cap})`
          ret.push(frame.copy())
          sum += arr[i];
          ans[i] = cnt
        } else {
          if (i != 0) {
            for (var j = 0; j < n; ++j) {
              if (j < prev || j > i) frame.states[j] = -1
              else if (j == i) frame.states[j] = 3
              else frame.states[j] = 0
            }
            frame.text = `น้ำหนักของเกิน! (${sum+arr[i]} > ${cap})`
            ret.push(frame.copy())
          }
          sum = 0
          cnt += 1
          prev = i
          for (var j = 0; j < n; ++j) {
            if (j < prev || j > i) frame.states[j] = -1
            else if (j == i) frame.states[j] = 2
            else frame.states[j] = 0
          }
          frame.text = `เปิดกล่องใหม่ (กล่องที่ ${cnt}) (${sum+arr[i]} ≤ ${cap})`
          ret.push(frame.copy())
          sum += arr[i]
          ans[i] = cnt
        }
      }
      for (var j = 0; j < n; ++j) {
        if (ans[j] % 2 == 0) frame.states[j] = 2
        else frame.states[j] = 1
      }
      frame.text = `บรรจุครบแล้ว สรุปว่าต้องใช้กล่องอย่างน้อย ${cnt} ใบจึงจะบรรจุของได้ทั้งหมด`
      ret.push(frame.copy())
      return ret
    },
    get_fill: function(arr, cap) {
      let n = arr.length, sum = 0, prev = 0, cnt = 0
      let ans = []
      for (var i = 0; i < n; ++i) {
        if (i != 0 && sum+arr[i] <= cap) {
          ans[ans.length-1].push(arr[i])
          sum += arr[i];
        } else {
          ans.push([])
          ans[ans.length-1].push(arr[i])
          sum = arr [i]
          cnt += 1
          prev = i
        }
      }
      return ans
    }

  }

})

var app = new Vue({
  el: "#article",
  delimiters: ["(<", ">)"]
})
